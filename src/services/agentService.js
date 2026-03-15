import { handleGlobalError } from '../utils/errors';

/**
 * Core service to handle the pay-then-execute flow of AgentArena.
 * Uses NATIVE HLUSD on HeLa Testnet (simple eth_sendTransaction).
 * Returns the final execution result or throws a handled error.
 */

// Treasury wallet that receives agent payments
const TREASURY_WALLET = '0x4bca2Fc95bf216fC11cf72Cb41860551CC66c2a0';

export async function executeAgent({
  agentId,
  endpoint,
  price,
  input,
  walletClient,
  publicClient,
  onStateChange
}) {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  try {
    // Build the fetch URL
    // /proxy/* paths are handled by Vite dev server proxy
    // http(s) URLs are used directly
    // anything else gets a localhost fallback
    let fetchUrl;
    if (endpoint.startsWith('/proxy/') || endpoint.startsWith('http')) {
      fetchUrl = endpoint;
    } else {
      fetchUrl = `http://localhost:8000${endpoint}`;
    }

    // STATE 1 - Probing backend
    if (onStateChange) onStateChange('probe');
    
    if (!isDemoMode) {
      try {
        const probe = await fetch(fetchUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input)
        });
        // We accept any response here — the probe just confirms the backend is reachable
        // Some backends may return 200 directly with the result
        if (probe.ok) {
          // Backend responded successfully without payment — return the result directly
          const probeResult = await probe.json();
          if (onStateChange) onStateChange('executing');
          return probeResult;
        }
        // If 4xx/5xx, we proceed to payment flow
      } catch (fetchErr) {
        // If fetch itself fails (network error / CORS), throw immediately
        throw new Error(`Failed to fetch: Cannot reach the AI agent backend. The Render server may still be starting up (cold start takes ~30s). Please retry in a moment.`);
      }
    }

    let txHash = '0xDEMO...MODE';

    // Payment via native HLUSD transfer (eth_sendTransaction)
    if (!isDemoMode && window.ethereum) {
      // STATE 2 - Paying
      if (onStateChange) onStateChange('paying');
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Wallet not connected. Please connect MetaMask first.');
      }
      
      const from = accounts[0];
      
      // Convert price to wei (price is in HLUSD, e.g. "0.05")
      const priceFloat = parseFloat(price);
      const weiValue = BigInt(Math.floor(priceFloat * 1e18));
      const hexValue = '0x' + weiValue.toString(16);

      // Simple native transfer to treasury
      txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: from,
          to: TREASURY_WALLET,
          value: hexValue,
          chainId: '0xa2d08'  // HeLa Testnet 666888
        }]
      });
      
      // Wait for confirmation
      if (onStateChange) onStateChange('confirming');
      let receipt = null;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 2000));
        receipt = await window.ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash]
        });
        if (receipt) break;
      }
      if (!receipt) {
        throw new Error('Transaction confirmation timed out. Please check your wallet.');
      }
    }

    // STATE 3 - Executing the agent
    if (onStateChange) onStateChange('executing');
    
    const result = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'x-payment-tx': txHash,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });
    
    if (!result.ok) {
      let errMsg = `Agent returned error ${result.status}`;
      try {
        const errBody = await result.json();
        errMsg = errBody.detail?.message || errBody.message || errBody.detail || errMsg;
      } catch { /* ignore parse errors */ }
      throw new Error(errMsg);
    }

    return await result.json();

  } catch (err) {
    if (isDemoMode) {
      console.warn('Backend unavailable, falling back to demo result');
      await new Promise(r => setTimeout(r, 1500));
      return {
        taskId: `0xDEMO_${Date.now().toString(16)}`,
        agentId: agentId,
        status: "success",
        result: { 
          summary: {
            startValue: "$12,450.00",
            endValue: "$13,892.50",
            pnl: "+$1,442.50",
            pnlPercent: "+11.58%"
          },
          content: "### Demo Execution Report\n\nTask executed successfully in demo mode.",
          sentiment: "BULLISH"
        }
      };
    }
    handleGlobalError(err);
    throw err;
  }
}
