import { useState, useEffect, useCallback } from 'react';

import { CONTRACT_ADDRESSES } from '../contracts/addresses';

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState('0.00');
  const [isConnected, setIsConnected] = useState(false);

  const fetchBalance = useCallback(async (addr) => {
    try {
      const hlusdAddress = CONTRACT_ADDRESSES.hlusd;
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

      // In demo mode with no real contract, show a realistic balance
      if (!hlusdAddress || hlusdAddress === '0x0000000000000000000000000000000000000000') {
        if (isDemoMode) {
          setBalance('15.00');
        } else {
          setBalance('0.00');
        }
        return;
      }
      const data = '0x70a08231' + addr.replace('0x', '').padStart(64, '0');
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{ to: hlusdAddress, data }, 'latest']
      });
      const wei = parseInt(result, 16);
      setBalance(isNaN(wei) ? '0.00' : (wei / 1e18).toFixed(2));
    } catch (err) {
      console.error('fetchBalance error:', err);
      setBalance('0.00');
    }
  }, []);

  const syncAccounts = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        fetchBalance(accounts[0]);
      } else {
        setAddress(null);
        setIsConnected(false);
        setBalance('0.00');
      }
    } catch {
      // silent fail
    }
  }, [fetchBalance]);

  useEffect(() => {
    // Check on mount
    syncAccounts();

    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        fetchBalance(accounts[0]);
      } else {
        setAddress(null);
        setIsConnected(false);
        setBalance('0.00');
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', syncAccounts);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', syncAccounts);
    };
  }, [syncAccounts, fetchBalance]);

  const connect = async () => {
    if (!window.ethereum) {
      alert('MetaMask not found. Please install MetaMask to continue.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        fetchBalance(accounts[0]);
      }
    } catch (err) {
      if (err.code === 4001) {
        console.log('User rejected the connection request.');
      } else {
        console.error('Connect error:', err);
      }
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setBalance('0.00');
  };

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return { address, balance, isConnected, connect, disconnect, shortAddress };
}
