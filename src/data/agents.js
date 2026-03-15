export const agents = [
  // CATEGORY: DeFi Execution (defi)
  {
    id: 1, name: "Atlas Rebalancer", category: "defi", framework: "LangGraph",
    pricePerCall: "0.05", reputationScore: 98, totalTasksCompleted: 1402,
    successCount: Math.round(0.98 * 1402), stakedAmount: 500, isActive: true,
    walletAddress: "0x7a3B...eF91", description: "Rebalances portfolios based on target asset allocations using live CoinGecko data.",
    endpointUrl: "/proxy/atlas/api/v1/rebalance",
    taskInputSchema: { 
      ETH: { type: "number", description: "Target allocation % (e.g. 50)" }, 
      BTC: { type: "number", description: "Target allocation % (e.g. 30)" }, 
      USDC: { type: "number", description: "Target allocation % (e.g. 20)" } 
    }
  },
  {
    id: 2, name: "Sniper Bot", category: "defi", framework: "LangGraph",
    pricePerCall: "0.10", reputationScore: 96, totalTasksCompleted: 890,
    successCount: Math.round(0.96 * 890), stakedAmount: 1000, isActive: true,
    walletAddress: "0x1bA4...dE85", description: "Identifies and executes arbitrage opportunities using real-time prices.",
    endpointUrl: "/proxy/sniper/api/v1/snipe",
    taskInputSchema: { 
      target_token: { type: "string", description: "e.g. WETH, LINK" }, 
      quote_currency: { type: "string", description: "e.g. USDT, USDC" }, 
      trade_volume_usd: { type: "number", description: "e.g. 10000" }, 
      min_profit_threshold: { type: "number", description: "e.g. 0.5 (%)" } 
    }
  },
  {
    id: 3, name: "Yield Harvester", category: "defi", framework: "CrewAI",
    pricePerCall: "0.04", reputationScore: 94, totalTasksCompleted: 2104,
    successCount: Math.round(0.94 * 2104), stakedAmount: 400, isActive: true,
    walletAddress: "0x3cD1...aB42", description: "Scans DeFi protocols for high APY pools using live DeFiLlama data.",
    endpointUrl: "/proxy/harvester/api/v1/harvest",
    taskInputSchema: { 
      deposit_token: { type: "string", description: "e.g. USDC, WETH" }, 
      deposit_amount_usd: { type: "number", description: "e.g. 5000" }, 
      chain: { type: "string", description: "e.g. Ethereum, Arbitrum" } 
    }
  },
  {
    id: 4, name: "Airdrop Hunter", category: "defi", framework: "CrewAI",
    pricePerCall: "0.04", reputationScore: 94, totalTasksCompleted: 2104,
    successCount: Math.round(0.94 * 2104), stakedAmount: 400, isActive: true,
    walletAddress: "0x1bC4...aA81", description: "Discovers hidden alpha and automates transaction routing to guarantee airdrop allocations.",
    endpointUrl: "/proxy/airdrop/api/v1/hunt",
    taskInputSchema: { 
      wallet: { type: "address", description: "0x..." }, 
      target_ecosystem: { type: "string", description: "e.g. Solana, Base, LayerZero" } 
    }
  },

  // CATEGORY: Business Ops (business)
  {
    id: 5, name: "Chrono Scheduler", category: "business", framework: "LangGraph",
    pricePerCall: "0.02", reputationScore: 99, totalTasksCompleted: 512,
    successCount: Math.round(0.99 * 512), stakedAmount: 300, isActive: true,
    walletAddress: "0x4eF0...bC21", description: "Schedules on-chain actions based on live conditions (gas prices, token prices).",
    endpointUrl: "/proxy/chrono/api/v1/schedule",
    taskInputSchema: { 
      action_type: { type: "string", description: "e.g. DCA, REBALANCE" }, 
      token: { type: "string", description: "e.g. ethereum, bitcoin" }, 
      amount_usd: { type: "number", description: "e.g. 50" }, 
      recipient_address: { type: "address", description: "0x..." }, 
      frequency: { type: "string", description: "e.g. daily, weekly, monthly" }, 
      max_gas_gwei: { type: "number", description: "e.g. 30" }, 
      price_trigger_usd: { type: "number", description: "e.g. 2500" }, 
      description: { type: "string", description: "e.g. Buy $50 of ETH every week" } 
    }
  },
  {
    id: 6, name: "Consigliere BI", category: "business", framework: "CrewAI",
    pricePerCall: "0.15", reputationScore: 97, totalTasksCompleted: 341,
    successCount: Math.round(0.97 * 341), stakedAmount: 1500, isActive: true,
    walletAddress: "0x8cD4...fA65", description: "Provides elite business strategy analysis using Yahoo Finance and Gemini AI.",
    endpointUrl: "/proxy/consigliere/api/v1/advise",
    taskInputSchema: { 
      ticker: { type: "string", description: "e.g. AAPL, BTC-USD" }, 
      business_question: { type: "string", description: "e.g. Is this a good time to acquire competitors?" }, 
      company_name: { type: "string", description: "e.g. Apple Inc." }, 
      industry: { type: "string", description: "e.g. AI, DeFi, SaaS" } 
    }
  },
  {
    id: 7, name: "Podcast Summarizer", category: "business", framework: "CrewAI",
    pricePerCall: "0.03", reputationScore: 91, totalTasksCompleted: 882,
    successCount: Math.round(0.91 * 882), stakedAmount: 250, isActive: true,
    walletAddress: "0x1cD5...fF02", description: "Flawlessly extracts action items and alpha from long crypto podcasts in seconds.",
    endpointUrl: "/proxy/summary/api/v1/summarize",
    taskInputSchema: { 
      meetingNotes: { type: "string", description: "Paste raw notes/transcript here..." }, 
      format: { type: "string", description: "e.g. action items, full summary" }, 
      attendees: { type: "string", description: "e.g. Vitalik, Brian Armstrong" } 
    }
  },

  // CATEGORY: Content Creation (content)
  {
    id: 8, name: "Scribe Creator", category: "content", framework: "CrewAI",
    pricePerCall: "0.01", reputationScore: 92, totalTasksCompleted: 687,
    successCount: Math.round(0.92 * 687), stakedAmount: 200, isActive: true,
    walletAddress: "0x4cD2...aF43", description: "Generates viral content (X threads, blog posts) using Gemini AI intelligence.",
    endpointUrl: "/proxy/scribe/api/v1/write",
    taskInputSchema: { 
      topic: { type: "string", description: "e.g. Web3 UX is broken" }, 
      source_url: { type: "string", description: "e.g. https://vitalik.ca/..." }, 
      raw_text: { type: "string", description: "Paste raw whitepaper text here..." }, 
      tone: { type: "string", description: "e.g. professional, controversial, hype" }, 
      audience: { type: "string", description: "e.g. Crypto Twitter, VC investors" } 
    }
  },

  // CATEGORY: Data Analysis (analysis)
  {
    id: 9, name: "Alpha Trend Spotter", category: "analysis", framework: "LangGraph",
    pricePerCall: "0.06", reputationScore: 95, totalTasksCompleted: 1654,
    successCount: Math.round(0.95 * 1654), stakedAmount: 480, isActive: true,
    walletAddress: "0x8eF4...bC65", description: "Analyzes global trending data from CoinGecko and synthesizes market narratives.",
    endpointUrl: "/proxy/trend/api/v1/analyze",
    taskInputSchema: { 
      query: { type: "string", description: "e.g. Layer 2 scaling trends" }, 
      timeframe: { type: "string", description: "e.g. 24h, 7d" }, 
      sources: { type: "string", description: "e.g. CoinGecko, Twitter Sentiment" } 
    }
  },
  {
    id: 10, name: "Whale Watcher", category: "analysis", framework: "LangGraph",
    pricePerCall: "0.02", reputationScore: 88, totalTasksCompleted: 341,
    successCount: Math.round(0.88 * 341), stakedAmount: 200, isActive: true,
    walletAddress: "0x3cD2...bB02", description: "Stateful tracker monitoring massive wallet movements to front-run dumps.",
    endpointUrl: "/proxy/whale/api/v1/scan",
    taskInputSchema: { 
      wallet_address: { type: "address", description: "0x..." }, 
      min_amount: { type: "number", description: "Monitor transfers larger than (USD): e.g. 50000" } 
    }
  },
  {
    id: 11, name: "Guardian Auditor", category: "analysis", framework: "LangGraph",
    pricePerCall: "0.09", reputationScore: 99, totalTasksCompleted: 512,
    successCount: Math.round(0.99 * 512), stakedAmount: 1000, isActive: true,
    walletAddress: "0x9aF4...cC11", description: "High-tier security crew for instant smart contract vulnerability scanning.",
    endpointUrl: "/proxy/guardian/api/v1/audit",
    taskInputSchema: { 
      contract_address: { type: "address", description: "0x..." }, 
      network: { type: "string", description: "e.g. Ethereum, BSC, Polygon" } 
    }
  },

  // CATEGORY: Finance & Taxes (finance)
  {
    id: 12, name: "Crypto Tax Reporter", category: "finance", framework: "LangGraph",
    pricePerCall: "0.08", reputationScore: 97, totalTasksCompleted: 1105,
    successCount: Math.round(0.97 * 1105), stakedAmount: 850, isActive: true,
    walletAddress: "0x0aA1...bB33", description: "Expert calculation crew generating legally compliant crypto tax frameworks.",
    endpointUrl: "/proxy/tax/api/v1/generate",
    taskInputSchema: { 
      wallet: { type: "address", description: "0x..." }, 
      taxYear: { type: "string", description: "e.g. 2024" }, 
      jurisdiction: { type: "string", description: "e.g. US, UK, DE" } 
    }
  }
];

export const categories = [
  { key: "all", label: "All Agents" },
  { key: "content", label: "Content Creation" },
  { key: "defi", label: "DeFi Execution" },
  { key: "analysis", label: "Data Analysis" },
  { key: "business", label: "Business Ops" },
  { key: "finance", label: "Finance & Tax" }
];

export const frameworkColors = {
  LangGraph: "#8B5CF6",
  CrewAI: "#10B981",
};

export const categoryColors = {
  defi: "#00D4FF",
  content: "#10B981",
  analysis: "#8B5CF6",
  business: "#F59E0B",
  finance: "#06B6D4"
};

export const getReputationColor = (score) => {
  if (score >= 90) return "#00FF94";
  if (score >= 70) return "#FFB800";
  return "#FF4444";
};
