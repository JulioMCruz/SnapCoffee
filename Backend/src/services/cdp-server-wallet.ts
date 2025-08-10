import { Coinbase, Wallet, ServerSigner } from '@coinbase/coinbase-sdk';
import { config } from '@/config';

/**
 * CDP Server Wallet service for autonomous coffee shop operations
 * Manages store wallets, automated transactions, and reward distribution
 */
export class CDPServerWalletService {
  private coinbase: Coinbase;
  private masterWallet: Wallet | null = null;
  private storeWallets: Map<string, Wallet> = new Map();

  constructor() {
    this.coinbase = new Coinbase({
      apiKeyName: process.env.CDP_API_KEY_NAME!,
      privateKey: process.env.CDP_API_KEY_PRIVATE_KEY!,
      useServerSigner: true // Enable server-side signing
    });
  }

  /**
   * Initialize master wallet for the Snap Coffee platform
   */
  async initializeMasterWallet(): Promise<Wallet> {
    if (this.masterWallet) {
      return this.masterWallet;
    }

    try {
      // Create or import existing master wallet
      if (process.env.MASTER_WALLET_ID) {
        // Import existing master wallet
        this.masterWallet = await this.coinbase.getWallet(process.env.MASTER_WALLET_ID);
      } else {
        // Create new master wallet
        this.masterWallet = await this.coinbase.createWallet({
          networkId: 'base-mainnet' // or base-sepolia for testing
        });
        
        console.log(`🔐 New Master Wallet Created: ${this.masterWallet.getId()}`);
        console.log(`📝 Update MASTER_WALLET_ID=${this.masterWallet.getId()} in environment`);
      }

      // Fund master wallet if needed (for gas fees)
      await this.ensureMasterWalletFunding();

      return this.masterWallet;
    } catch (error) {
      console.error('Error initializing master wallet:', error);
      throw new Error('Failed to initialize master wallet');
    }
  }

  /**
   * Create dedicated server wallet for a coffee shop
   */
  async createStoreWallet(params: {
    storeName: string;
    storeId: string;
    city: string;
    state: string;
    placeId: string;
  }): Promise<{
    wallet: Wallet;
    address: string;
    walletId: string;
    couponContractAddress?: string;
  }> {
    try {
      // Create server wallet for the store
      const storeWallet = await this.coinbase.createWallet({
        networkId: 'base-mainnet'
      });

      // Cache wallet for future operations
      this.storeWallets.set(params.storeId, storeWallet);

      const defaultAddress = await storeWallet.getDefaultAddress();

      // Fund store wallet with initial gas money from master wallet
      await this.fundStoreWallet(storeWallet, 0.01); // 0.01 ETH for gas

      // Deploy store-specific NFT coupon contract
      const couponContractAddress = await this.deployStoreCouponContract({
        storeWallet,
        storeName: params.storeName,
        storeId: params.storeId
      });

      console.log(`☕ Store Wallet Created for ${params.storeName}:`);
      console.log(`   Wallet ID: ${storeWallet.getId()}`);
      console.log(`   Address: ${defaultAddress.getId()}`);
      console.log(`   Coupon Contract: ${couponContractAddress}`);

      return {
        wallet: storeWallet,
        address: defaultAddress.getId(),
        walletId: storeWallet.getId(),
        couponContractAddress
      };

    } catch (error) {
      console.error('Error creating store wallet:', error);
      throw new Error(`Failed to create wallet for ${params.storeName}`);
    }
  }

  /**
   * Deploy NFT coupon contract for a specific store
   */
  private async deployStoreCouponContract(params: {
    storeWallet: Wallet;
    storeName: string;
    storeId: string;
  }): Promise<string> {
    try {
      // Smart contract deployment for store-specific NFT coupons
      const contractInvocation = await params.storeWallet.invokeContract({
        contractAddress: process.env.NFT_FACTORY_ADDRESS!, // Factory contract address
        method: 'createStoreCoupon',
        args: {
          storeName: params.storeName,
          storeId: params.storeId,
          redemptionRule: '10_coffees_1_free', // 10 coffees = 1 free drink
          maxSupply: 10000, // Maximum coupons per store
          validityPeriod: 365 * 24 * 60 * 60 // 1 year validity
        }
      });

      await contractInvocation.wait();

      // Extract deployed contract address from transaction logs
      const deployedAddress = contractInvocation.getTransaction().getContractAddress();
      
      return deployedAddress;
    } catch (error) {
      console.error('Error deploying store coupon contract:', error);
      throw new Error('Failed to deploy coupon contract');
    }
  }

  /**
   * Autonomous reward distribution to users
   */
  async distributeReward(params: {
    userAddress: string;
    amount: number;
    rewardType: 'BEAN_TOKEN' | 'NFT_COUPON';
    storeId?: string;
    reason: string;
  }): Promise<{
    transactionHash: string;
    amount: number;
    tokenAddress: string;
  }> {
    try {
      const masterWallet = await this.initializeMasterWallet();

      if (params.rewardType === 'BEAN_TOKEN') {
        // Distribute BEAN tokens from master wallet
        const transfer = await masterWallet.transfer({
          amount: params.amount,
          assetId: process.env.BEAN_TOKEN_ADDRESS!,
          destination: params.userAddress
        });

        await transfer.wait();

        console.log(`🪙 BEAN Reward Distributed:`);
        console.log(`   User: ${params.userAddress}`);
        console.log(`   Amount: ${params.amount} BEAN`);
        console.log(`   Reason: ${params.reason}`);
        console.log(`   TX: ${transfer.getTransactionHash()}`);

        return {
          transactionHash: transfer.getTransactionHash()!,
          amount: params.amount,
          tokenAddress: process.env.BEAN_TOKEN_ADDRESS!
        };

      } else if (params.rewardType === 'NFT_COUPON' && params.storeId) {
        // Mint NFT coupon from store wallet
        const storeWallet = this.storeWallets.get(params.storeId);
        if (!storeWallet) {
          throw new Error(`Store wallet not found for store: ${params.storeId}`);
        }

        const mintInvocation = await storeWallet.invokeContract({
          contractAddress: process.env.COUPON_NFT_ADDRESS!, // Store's coupon contract
          method: 'mintCoupon',
          args: {
            to: params.userAddress,
            storeId: params.storeId,
            redeemableValue: 'one_free_coffee',
            expirationDate: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
          }
        });

        await mintInvocation.wait();

        console.log(`🎫 NFT Coupon Minted:`);
        console.log(`   User: ${params.userAddress}`);
        console.log(`   Store: ${params.storeId}`);
        console.log(`   Reason: ${params.reason}`);
        console.log(`   TX: ${mintInvocation.getTransactionHash()}`);

        return {
          transactionHash: mintInvocation.getTransactionHash()!,
          amount: 1, // 1 NFT
          tokenAddress: process.env.COUPON_NFT_ADDRESS!
        };
      }

      throw new Error(`Unsupported reward type: ${params.rewardType}`);

    } catch (error) {
      console.error('Error distributing reward:', error);
      throw new Error('Failed to distribute reward');
    }
  }

  /**
   * Validate and process coupon redemption at coffee shop
   */
  async processCouponRedemption(params: {
    userAddress: string;
    couponTokenId: string;
    storeId: string;
    redemptionCode: string;
  }): Promise<{
    success: boolean;
    transactionHash?: string;
    redemptionValue: string;
  }> {
    try {
      const storeWallet = this.storeWallets.get(params.storeId);
      if (!storeWallet) {
        throw new Error(`Store wallet not found: ${params.storeId}`);
      }

      // Verify coupon ownership and validity
      const verificationResult = await storeWallet.invokeContract({
        contractAddress: process.env.COUPON_NFT_ADDRESS!,
        method: 'verifyCouponRedemption',
        args: {
          tokenId: params.couponTokenId,
          userAddress: params.userAddress,
          storeId: params.storeId,
          redemptionCode: params.redemptionCode
        }
      });

      await verificationResult.wait();

      // Mark coupon as redeemed (transfer to burn address or update metadata)
      const redemptionResult = await storeWallet.invokeContract({
        contractAddress: process.env.COUPON_NFT_ADDRESS!,
        method: 'redeemCoupon',
        args: {
          tokenId: params.couponTokenId,
          redeemer: params.userAddress,
          timestamp: Math.floor(Date.now() / 1000)
        }
      });

      await redemptionResult.wait();

      console.log(`✅ Coupon Redeemed:`);
      console.log(`   User: ${params.userAddress}`);
      console.log(`   Token ID: ${params.couponTokenId}`);
      console.log(`   Store: ${params.storeId}`);
      console.log(`   TX: ${redemptionResult.getTransactionHash()}`);

      return {
        success: true,
        transactionHash: redemptionResult.getTransactionHash()!,
        redemptionValue: 'one_free_coffee'
      };

    } catch (error) {
      console.error('Error processing coupon redemption:', error);
      return {
        success: false,
        redemptionValue: 'redemption_failed'
      };
    }
  }

  /**
   * Get store wallet analytics and metrics
   */
  async getStoreAnalytics(storeId: string): Promise<{
    totalTransactions: number;
    couponsIssued: number;
    couponsRedeemed: number;
    totalRewards: number;
    walletBalance: number;
  }> {
    try {
      const storeWallet = this.storeWallets.get(storeId);
      if (!storeWallet) {
        throw new Error(`Store wallet not found: ${storeId}`);
      }

      // Get wallet balance
      const balances = await storeWallet.listBalances();
      const ethBalance = balances.find(b => b.getAsset().getAssetId() === 'eth')?.getAmount() || 0;

      // Query contract for analytics data
      const analyticsResult = await storeWallet.invokeContract({
        contractAddress: process.env.COUPON_NFT_ADDRESS!,
        method: 'getStoreAnalytics',
        args: { storeId }
      });

      const analytics = analyticsResult.getResult();

      return {
        totalTransactions: analytics.totalTransactions || 0,
        couponsIssued: analytics.couponsIssued || 0,
        couponsRedeemed: analytics.couponsRedeemed || 0,
        totalRewards: analytics.totalRewards || 0,
        walletBalance: ethBalance
      };

    } catch (error) {
      console.error('Error getting store analytics:', error);
      return {
        totalTransactions: 0,
        couponsIssued: 0,
        couponsRedeemed: 0,
        totalRewards: 0,
        walletBalance: 0
      };
    }
  }

  /**
   * Ensure master wallet has sufficient funding for operations
   */
  private async ensureMasterWalletFunding(): Promise<void> {
    if (!this.masterWallet) return;

    try {
      const balances = await this.masterWallet.listBalances();
      const ethBalance = balances.find(b => b.getAsset().getAssetId() === 'eth')?.getAmount() || 0;

      if (ethBalance < 0.1) { // Less than 0.1 ETH
        console.log('⚠️ Master wallet funding low. Please add ETH for gas fees.');
        // In production, you might want to automatically top up from a funding source
      }
    } catch (error) {
      console.error('Error checking master wallet funding:', error);
    }
  }

  /**
   * Fund store wallet from master wallet
   */
  private async fundStoreWallet(storeWallet: Wallet, amount: number): Promise<void> {
    try {
      const masterWallet = await this.initializeMasterWallet();
      const storeAddress = await storeWallet.getDefaultAddress();

      const transfer = await masterWallet.transfer({
        amount: amount,
        assetId: 'eth', // ETH for gas
        destination: storeAddress.getId()
      });

      await transfer.wait();
      
      console.log(`💰 Store wallet funded with ${amount} ETH for gas fees`);
    } catch (error) {
      console.error('Error funding store wallet:', error);
      throw new Error('Failed to fund store wallet');
    }
  }

  /**
   * Batch operations for efficiency
   */
  async batchRewardDistribution(rewards: Array<{
    userAddress: string;
    amount: number;
    rewardType: 'BEAN_TOKEN' | 'NFT_COUPON';
    storeId?: string;
    reason: string;
  }>): Promise<{
    successful: number;
    failed: number;
    transactions: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      transactions: [] as string[]
    };

    // Process rewards in batches of 10 for efficiency
    const batchSize = 10;
    for (let i = 0; i < rewards.length; i += batchSize) {
      const batch = rewards.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (reward) => {
          try {
            const result = await this.distributeReward(reward);
            results.successful++;
            results.transactions.push(result.transactionHash);
          } catch (error) {
            console.error(`Failed to distribute reward to ${reward.userAddress}:`, error);
            results.failed++;
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < rewards.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

// Export singleton instance
export const cdpServerWalletService = new CDPServerWalletService();