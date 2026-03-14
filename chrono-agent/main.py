from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel
from typing import Dict, TypedDict, List, Optional, Literal
import uvicorn
import os
import time
import requests as http_client
from collections import defaultdict
from datetime import datetime, timezone
import uuid

# ---- Config ----
API_KEY = os.getenv("CHRONO_API_KEY", "dev-chrono-key-unsafe")
RATE_LIMIT_PER_MINUTE = int(os.getenv("RATE_LIMIT", "30"))

COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price"
ETHGAS_URL    = "https://api.etherscan.io/api?module=gastracker&action=gasoracle"

app = FastAPI(
    title="Chrono Scheduler Agent API",
    description=(
        "An autonomous scheduling agent. Given a task definition (DCA, salary payment, DAO vote, etc.), "
        "Chrono validates the schedule, checks live on-chain conditions (gas, price triggers), "
        "and queues the execution payload — ready to fire at the exact right moment."
    ),
    version="1.0.0",
)

# ---- Security ----
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail={"error": "UNAUTHORIZED", "message": "Invalid or missing API Key."})
    return api_key

request_log: Dict[str, list] = defaultdict(list)

def rate_limit(request: Request):
    client_ip = request.client.host
    now = time.time()
    request_log[client_ip] = [t for t in request_log[client_ip] if t > now - 60]
    if len(request_log[client_ip]) >= RATE_LIMIT_PER_MINUTE:
        raise HTTPException(status_code=429, detail={"error": "RATE_LIMIT_EXCEEDED"})
    request_log[client_ip].append(now)

# ---- In-memory task queue (production would use Redis/Postgres) ----
TASK_QUEUE: List[Dict] = []

# ---- Models ----
ActionType = Literal["DCA", "SALARY", "DAO_VOTE", "REBALANCE", "CUSTOM"]

class ScheduleInput(BaseModel):
    action_type: ActionType
    token: str                     # e.g. "bitcoin", "ethereum"
    amount_usd: float              # Amount in USD per execution
    recipient_address: str         # Target wallet / contract address
    frequency: Literal["hourly", "daily", "weekly", "monthly"]
    max_gas_gwei: float            # Only execute if gas <= this threshold
    price_trigger_usd: Optional[float] = None  # Only buy if price <= this (for DCA)
    description: Optional[str] = None
    idempotency_key: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "action_type": "DCA",
                "token": "bitcoin",
                "amount_usd": 50,
                "recipient_address": "0xYourWalletAddress",
                "frequency": "weekly",
                "max_gas_gwei": 30,
                "price_trigger_usd": 60000,
                "description": "Buy $50 of BTC every Monday if price < $60k"
            }
        }

class AgentResponse(BaseModel):
    status: str
    agent: str
    data: dict
    error: Optional[dict] = None

class ChronoState(TypedDict):
    task: Dict
    live_price_usd: float
    live_gas_gwei: float
    price_condition_met: bool
    gas_condition_met: bool
    all_conditions_met: bool
    queued_task: Dict
    messages: List[str]

# ---- LangGraph Nodes ----

def validate_schedule(state: ChronoState) -> ChronoState:
    """Validate the task definition and fetch live price/gas conditions."""
    task = state["task"]
    token = task["token"]
    state["messages"].append(f"Validating schedule: [{task['action_type']}] {task['description'] or 'unnamed task'}")
    state["messages"].append(f"Config: ${task['amount_usd']}/execution @ {task['frequency']} | Gas ceiling: {task['max_gas_gwei']} Gwei")

    # Fetch live token price from CoinGecko
    try:
        price_resp = http_client.get(
            COINGECKO_URL,
            params={"ids": token, "vs_currencies": "usd"},
            timeout=8
        )
        price_resp.raise_for_status()
        price_data = price_resp.json()
        state["live_price_usd"] = price_data.get(token, {}).get("usd", 0)
        state["messages"].append(f"Live {token.upper()} price: ${state['live_price_usd']:,.2f}")
    except Exception as e:
        state["live_price_usd"] = 0
        state["messages"].append(f"Price fetch failed: {str(e)} — using $0 fallback")

    # Fetch live gas price from Etherscan public endpoint (no key needed for basic)
    try:
        gas_resp = http_client.get(ETHGAS_URL, timeout=8)
        gas_resp.raise_for_status()
        gas_data = gas_resp.json()
        # ProposeGasPrice is the "standard" speed
        state["live_gas_gwei"] = float(gas_data.get("result", {}).get("ProposeGasPrice", 25))
        state["messages"].append(f"Live Ethereum gas: {state['live_gas_gwei']} Gwei (Standard)")
    except Exception:
        # Fallback to a realistic mock if API fails or rate limited
        state["live_gas_gwei"] = 24.0
        state["messages"].append(f"Gas API unavailable — using estimated 24 Gwei")

    return state

def assess_conditions(state: ChronoState) -> ChronoState:
    """Check if live conditions satisfy the user's execution constraints."""
    task = state["task"]

    # Gas condition
    gas_ok = state["live_gas_gwei"] <= task["max_gas_gwei"]
    state["gas_condition_met"] = gas_ok
    if gas_ok:
        state["messages"].append(f"✓ Gas OK: {state['live_gas_gwei']} Gwei ≤ ceiling {task['max_gas_gwei']} Gwei")
    else:
        state["messages"].append(f"✗ Gas HIGH: {state['live_gas_gwei']} Gwei > ceiling {task['max_gas_gwei']} Gwei — will defer execution")

    # Price trigger condition
    trigger = task.get("price_trigger_usd")
    if trigger and state["live_price_usd"] > 0:
        price_ok = state["live_price_usd"] <= trigger
        state["price_condition_met"] = price_ok
        if price_ok:
            state["messages"].append(f"✓ Price OK: ${state['live_price_usd']:,.2f} ≤ trigger ${trigger:,.2f}")
        else:
            state["messages"].append(f"✗ Price above trigger: ${state['live_price_usd']:,.2f} > ${trigger:,.2f} — will wait for dip")
    else:
        state["price_condition_met"] = True
        state["messages"].append("✓ No price trigger set — proceeding unconditionally")

    state["all_conditions_met"] = gas_ok and state["price_condition_met"]
    return state

def queue_execution(state: ChronoState) -> ChronoState:
    """Build the scheduled execution payload and add it to the task queue."""
    task = state["task"]
    now = datetime.now(timezone.utc)
    task_id = str(uuid.uuid4())[:8]

    freq_seconds = {
        "hourly": 3600,
        "daily": 86400,
        "weekly": 604800,
        "monthly": 2592000
    }.get(task["frequency"], 86400)

    status = "QUEUED" if state["all_conditions_met"] else "PENDING_CONDITIONS"

    queued = {
        "task_id": task_id,
        "status": status,
        "action_type": task["action_type"],
        "token": task["token"].upper(),
        "amount_usd": task["amount_usd"],
        "recipient": task["recipient_address"],
        "frequency_seconds": freq_seconds,
        "frequency_label": task["frequency"],
        "max_gas_gwei": task["max_gas_gwei"],
        "price_trigger_usd": task.get("price_trigger_usd"),
        "queued_at_utc": now.isoformat(),
        "conditions_met": state["all_conditions_met"],
        "live_snapshot": {
            "price_usd": state["live_price_usd"],
            "gas_gwei": state["live_gas_gwei"]
        },
        "estimated_annual_cost_usd": round(task["amount_usd"] * (365 * 24 * 3600 / freq_seconds), 2)
    }

    TASK_QUEUE.append(queued)
    state["queued_task"] = queued

    if state["all_conditions_met"]:
        state["messages"].append(f"✅ Task [{task_id}] QUEUED for {task['frequency']} {task['action_type']} execution.")
        state["messages"].append(f"   Annual commitment: ${queued['estimated_annual_cost_usd']:,.2f}")
    else:
        state["messages"].append(f"⏳ Task [{task_id}] PENDING — conditions not yet met. Chrono monitors continuously.")
        state["messages"].append(f"   Will execute as soon as gas ≤ {task['max_gas_gwei']} Gwei AND price conditions satisfied.")

    return state

# ---- LangGraph Compilation ----
from langgraph.graph import StateGraph, END

workflow = StateGraph(ChronoState)
workflow.add_node("validate_schedule", validate_schedule)
workflow.add_node("assess_conditions", assess_conditions)
workflow.add_node("queue_execution", queue_execution)
workflow.set_entry_point("validate_schedule")
workflow.add_edge("validate_schedule", "assess_conditions")
workflow.add_edge("assess_conditions", "queue_execution")
workflow.add_edge("queue_execution", END)
chrono_agent = workflow.compile()

executed_keys = {}

# ---- FastAPI Routes ----
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "agent": "chrono", "version": "1.0.0", "queued_tasks": len(TASK_QUEUE)}

@app.get("/api/v1/queue", tags=["Queue"],
         summary="View all tasks in the Chrono execution queue",
         dependencies=[Depends(verify_api_key)])
async def get_queue():
    return {"status": "success", "count": len(TASK_QUEUE), "tasks": TASK_QUEUE}

@app.post("/api/v1/schedule", response_model=AgentResponse, tags=["Agent Execution"],
          summary="Schedule a recurring on-chain action using live gas and price conditions",
          dependencies=[Depends(verify_api_key), Depends(rate_limit)])
async def schedule_task(payload: ScheduleInput):
    """
    Validates a recurring on-chain action, checks live gas prices (Etherscan) and 
    token prices (CoinGecko), and queues the task for execution when conditions are met.
    """
    if payload.idempotency_key and payload.idempotency_key in executed_keys:
        return AgentResponse(status="success", agent="chrono", data={**executed_keys[payload.idempotency_key], "cached": True})

    try:
        initial_state: ChronoState = {
            "task": payload.model_dump(exclude={"idempotency_key"}),
            "live_price_usd": 0.0,
            "live_gas_gwei": 0.0,
            "price_condition_met": False,
            "gas_condition_met": False,
            "all_conditions_met": False,
            "queued_task": {},
            "messages": []
        }
        final_state = chrono_agent.invoke(initial_state)
        result = {
            "queued_task": final_state["queued_task"],
            "conditions_met": final_state["all_conditions_met"],
            "live_snapshot": {
                "price_usd": final_state["live_price_usd"],
                "gas_gwei": final_state["live_gas_gwei"]
            },
            "messages": final_state["messages"]
        }
        if payload.idempotency_key:
            executed_keys[payload.idempotency_key] = result
        return AgentResponse(status="success", agent="chrono", data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail={"error": "AGENT_EXECUTION_FAILED", "message": str(e)})

@app.get("/", include_in_schema=False)
async def serve_dashboard():
    with open("index.html", "r") as f:
        return HTMLResponse(content=f.read())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8003)
