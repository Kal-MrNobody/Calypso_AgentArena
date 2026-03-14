import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { CONTRACT_ADDRESSES } from '../contracts/addresses';
import { Droplet, Loader2 } from 'lucide-react';

export default function FaucetWidget({ compact = false }) {
  const { isConnected, address } = useWallet();
  const [minted, setMinted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Raw keccak256("mint(address,uint256)") = 0x40c10f19
  // 100 tokens with 18 decimals = 100000000000000000000 = 0x056bc75e2d63100000
  const handleMint = async () => {
    if (!isConnected || !window.ethereum) return;
    
    setIsLoading(true);
    setMinted(false);
    
    try {
      // Basic ABI encoding for mint(address to, uint256 amount)
      const functionSelector = '0x40c10f19';
      const toParam = address.replace('0x', '').padStart(64, '0');
      const amountParam = '056bc75e2d63100000'.padStart(64, '0');
      const data = functionSelector + toParam + amountParam;
      
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: CONTRACT_ADDRESSES.hlusd,
          data: data,
        }],
      });
      
      console.log('Mint tx sent:', txHash);
      setMinted(true);
    } catch (err) {
      console.error('Mint failed:', err);
    } finally {
      setIsLoading(false);
    }
  };


  if (compact) {
    return (
      <button 
        onClick={handleMint}
        disabled={isLoading}
        className="flex items-center gap-1.5 text-xs text-primary hover:text-white transition-colors bg-primary/10 hover:bg-primary/20 px-2 py-1.5 rounded-md border border-primary/30 disabled:opacity-50"
        title="Get 100 free testnet HLUSD"
      >
        {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Droplet size={12} />}
        <span>{minted ? '✓ Minted!' : 'Get HLUSD'}</span>
      </button>
    );
  }

  return (
    <div className="bg-card rounded-xl p-4 border border-border flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
       <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
           <Droplet size={20} />
         </div>
         <div>
            <h3 className="font-semibold text-white">Need testnet tokens?</h3>
            <p className="text-sm text-muted">Get free 100 HLUSD for AgentArena HeLa testing.</p>
         </div>
       </div>
       <button
          onClick={handleMint}
          disabled={isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-primary/20 to-[#00FF94]/20 border border-primary/50 text-white rounded-lg hover:from-primary/30 hover:to-[#00FF94]/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
       >
         {isLoading ? <><Loader2 size={16} className="animate-spin" /> Minting...</> : minted ? '✓ Minted!' : 'Mint 100 HLUSD'}
       </button>
    </div>
  );
}
