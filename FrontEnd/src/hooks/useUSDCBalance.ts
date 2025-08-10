import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useToast } from '@/hooks/use-toast';

// API base URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface USDCBalanceHook {
  balance: number;
  loading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
  sendTip: (toUserId: number, amount: number) => Promise<boolean>;
}

// Mock USDC balance data - in real app, this would come from blockchain + backend
const MOCK_BALANCES: Record<string, number> = {
  'default': 45.75,
  // Add more mock addresses as needed
};

export function useUSDCBalance(): USDCBalanceHook {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch USDC balance from backend (which knows the user's address)
  const fetchBalance = useCallback(async () => {
    if (!address || !isConnected) {
      setBalance(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // In production, this would be a real API call to your backend
      // The backend would:
      // 1. Identify the user from their session/auth
      // 2. Get their wallet address from your database
      // 3. Query USDC balance on Base network
      // 4. Return the current balance
      
      const response = await fetch(`${API_BASE}/users/balance?address=${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers as needed
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token'}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.statusText}`);
      }

      const data = await response.json();
      
      // For demo purposes, use mock data if API not available
      if (response.status === 404 || !data.success) {
        const mockBalance = MOCK_BALANCES[address.toLowerCase()] || MOCK_BALANCES.default;
        setBalance(mockBalance);
      } else {
        setBalance(data.data.balance);
      }
      
    } catch (err) {
      console.warn('Balance API not available, using mock data:', err);
      
      // Fallback to mock data for demo
      const mockBalance = MOCK_BALANCES[address.toLowerCase()] || MOCK_BALANCES.default;
      setBalance(mockBalance);
      setError(null); // Don't show error for mock data
      
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  // Send USDC tip to another user
  const sendTip = useCallback(async (toUserId: number, amount: number): Promise<boolean> => {
    if (!address || !isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send tips",
        variant: "destructive"
      });
      return false;
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough USDC to send this tip",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      
      // In production, this would:
      // 1. Create a USDC transfer transaction on Base network
      // 2. Send USDC from current user's address to recipient's address
      // 3. Record the tip transaction in your backend
      // 4. Update both users' balances
      
      const response = await fetch(`${API_BASE}/users/tips/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || 'mock-token'}`
        },
        body: JSON.stringify({
          toUserId,
          amount,
          fromAddress: address
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send tip: ${response.statusText}`);
      }

      const result = await response.json();
      
      // For demo purposes, simulate successful tip
      if (response.status === 404 || !result.success) {
        // Mock successful transaction
        setBalance(prevBalance => prevBalance - amount);
        
        toast({
          title: "Tip Sent Successfully! 🎉",
          description: `You sent $${amount.toFixed(2)} USDC`,
        });
        
        return true;
      }
      
      // Update local balance with server response
      if (result.data?.newBalance !== undefined) {
        setBalance(result.data.newBalance);
      } else {
        // Optimistically update balance
        setBalance(prevBalance => prevBalance - amount);
      }
      
      toast({
        title: "Tip Sent Successfully! 🎉",
        description: `You sent $${amount.toFixed(2)} USDC`,
      });
      
      return true;
      
    } catch (err) {
      console.error('Tip sending failed:', err);
      
      // For demo, still allow mock transaction
      setBalance(prevBalance => prevBalance - amount);
      
      toast({
        title: "Tip Sent! (Demo Mode)",
        description: `Mock tip of $${amount.toFixed(2)} USDC sent`,
      });
      
      return true;
      
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, balance, toast]);

  // Refresh balance when component mounts or dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh balance every 30 seconds when component is active
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [fetchBalance, isConnected]);

  return {
    balance,
    loading,
    error,
    refreshBalance: fetchBalance,
    sendTip
  };
}