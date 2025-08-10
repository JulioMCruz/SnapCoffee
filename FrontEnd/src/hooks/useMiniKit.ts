import { useState, useEffect, useCallback } from 'react';
import { MiniKit, tokenTransfer, TokenTransferParams, transactionStatus, TransactionStatusParams } from '@coinbase/onchainkit/minikit';
import { useToast } from '@/hooks/use-toast';

/**
 * MiniKit integration hook for Farcaster mini app
 * Handles wallet connections, transactions, and Base network operations
 */
export const useMiniKit = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize MiniKit on component mount
  useEffect(() => {
    const initializeMiniKit = async () => {
      try {
        // Check if running in Farcaster environment
        if (typeof window !== 'undefined' && window.MiniKit) {
          setIsAvailable(true);
          
          // Check existing connection
          const address = await MiniKit.getAddress();
          if (address) {
            setWalletAddress(address);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('MiniKit initialization error:', error);
      }
    };

    initializeMiniKit();
  }, []);

  /**
   * Connect to user's Farcaster wallet
   */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!isAvailable) {
      toast({
        title: "MiniKit Not Available",
        description: "Please open this app within Farcaster",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Request wallet connection
      const address = await MiniKit.connect();
      
      if (address) {
        setWalletAddress(address);
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected! 🎉",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`
        });
        
        return address;
      }
      
      return null;
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to wallet",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAvailable, toast]);

  /**
   * Send BEAN token rewards to user
   */
  const sendBeanReward = useCallback(async (params: {
    amount: string;
    reason: string;
  }): Promise<{ success: boolean; transactionHash?: string }> => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const transferParams: TokenTransferParams = {
        to: walletAddress,
        value: params.amount,
        tokenAddress: import.meta.env.VITE_BEAN_TOKEN_ADDRESS!, // $BEAN token on Base
        chainId: 8453 // Base mainnet
      };

      // Execute token transfer via MiniKit
      const { transactionId } = await tokenTransfer(transferParams);

      // Wait for transaction confirmation
      const statusParams: TransactionStatusParams = {
        transactionId
      };

      const status = await transactionStatus(statusParams);

      if (status.status === 'success') {
        toast({
          title: "🪙 BEAN Tokens Earned!",
          description: `${params.amount} BEAN tokens for ${params.reason}`,
        });

        return {
          success: true,
          transactionHash: status.transactionHash
        };
      } else {
        throw new Error(`Transaction failed: ${status.status}`);
      }

    } catch (error) {
      console.error('BEAN reward error:', error);
      toast({
        title: "Reward Failed",
        description: "Failed to send BEAN tokens",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, toast]);

  /**
   * Send USDC tip to creator
   */
  const sendUSDCTip = useCallback(async (params: {
    toAddress: string;
    amount: string;
    creatorName: string;
  }): Promise<{ success: boolean; transactionHash?: string }> => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const transferParams: TokenTransferParams = {
        to: params.toAddress,
        value: params.amount,
        tokenAddress: import.meta.env.VITE_USDC_TOKEN_ADDRESS!, // USDC on Base
        chainId: 8453 // Base mainnet
      };

      // Execute USDC transfer via MiniKit
      const { transactionId } = await tokenTransfer(transferParams);

      // Wait for confirmation
      const statusParams: TransactionStatusParams = {
        transactionId
      };

      const status = await transactionStatus(statusParams);

      if (status.status === 'success') {
        toast({
          title: "💰 Tip Sent Successfully!",
          description: `${params.amount} USDC sent to ${params.creatorName}`,
        });

        return {
          success: true,
          transactionHash: status.transactionHash
        };
      } else {
        throw new Error(`Transaction failed: ${status.status}`);
      }

    } catch (error) {
      console.error('USDC tip error:', error);
      toast({
        title: "Tip Failed",
        description: "Failed to send tip",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, toast]);

  /**
   * Mint NFT coupon for user (10 coffees = 1 free)
   */
  const mintCoupon = useCallback(async (params: {
    storeId: string;
    storeName: string;
  }): Promise<{ success: boolean; tokenId?: string; transactionHash?: string }> => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      // Call backend to mint coupon via server wallet
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/agents/mint-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: walletAddress,
          storeId: params.storeId,
          storeName: params.storeName,
          reason: 'completed_10_coffees'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "🎫 Free Coffee Coupon Earned!",
          description: `Redeemable at ${params.storeName}`,
        });

        return {
          success: true,
          tokenId: data.data?.tokenId,
          transactionHash: data.data?.transactionHash
        };
      } else {
        throw new Error(data.message || 'Coupon minting failed');
      }

    } catch (error) {
      console.error('Coupon minting error:', error);
      toast({
        title: "Coupon Failed",
        description: "Failed to mint coupon",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, toast]);

  /**
   * Redeem NFT coupon at coffee shop
   */
  const redeemCoupon = useCallback(async (params: {
    couponTokenId: string;
    storeId: string;
    redemptionCode: string;
  }): Promise<{ success: boolean; value?: string }> => {
    if (!isConnected || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      // Call backend agent to process redemption
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/agents/validate-coupon-redemption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: walletAddress,
          couponTokenId: params.couponTokenId,
          storeId: params.storeId,
          redemptionCode: params.redemptionCode
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "☕ Coupon Redeemed!",
          description: "Enjoy your free coffee!",
        });

        return {
          success: true,
          value: data.data?.redemptionValue
        };
      } else {
        throw new Error(data.message || 'Coupon redemption failed');
      }

    } catch (error) {
      console.error('Coupon redemption error:', error);
      toast({
        title: "Redemption Failed",
        description: "Failed to redeem coupon",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [isConnected, walletAddress, toast]);

  /**
   * Get user's token balances on Base
   */
  const getBalances = useCallback(async (): Promise<{
    bean: string;
    usdc: string;
    eth: string;
  }> => {
    if (!isConnected || !walletAddress) {
      return { bean: '0', usdc: '0', eth: '0' };
    }

    try {
      // Call backend to get balances via Base RPC
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/balances?address=${walletAddress}`);
      const data = await response.json();

      if (data.success) {
        return {
          bean: data.data.bean || '0',
          usdc: data.data.usdc || '0',
          eth: data.data.eth || '0'
        };
      }

      return { bean: '0', usdc: '0', eth: '0' };
    } catch (error) {
      console.error('Balance fetch error:', error);
      return { bean: '0', usdc: '0', eth: '0' };
    }
  }, [isConnected, walletAddress]);

  /**
   * Switch to Base network (if not already)
   */
  const ensureBaseNetwork = useCallback(async (): Promise<boolean> => {
    try {
      // MiniKit should already be on Base, but check anyway
      const chainId = await MiniKit.getChainId();
      
      if (chainId !== 8453) { // Base mainnet
        toast({
          title: "Network Switch Required",
          description: "Please switch to Base network",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  }, [toast]);

  return {
    // State
    isAvailable,
    isConnected,
    walletAddress,
    loading,

    // Actions
    connectWallet,
    sendBeanReward,
    sendUSDCTip,
    mintCoupon,
    redeemCoupon,
    getBalances,
    ensureBaseNetwork,

    // Utilities
    formatAddress: (address: string) => 
      `${address.slice(0, 6)}...${address.slice(-4)}`,
    isValidAddress: (address: string) => 
      /^0x[a-fA-F0-9]{40}$/.test(address)
  };
};