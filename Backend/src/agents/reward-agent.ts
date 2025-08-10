import { CdpAgentkit } from '@coinbase/cdp-agentkit-core';
import { CdpAgent } from '@coinbase/cdp-agentkit-langchain';
import { HumanMessage } from '@langchain/core/messages';
import { cdpServerWalletService } from '@/services/cdp-server-wallet';

/**
 * Autonomous AI agent for coffee snap validation and reward distribution
 * Integrates with CDP Agent Kit for blockchain operations
 */
export class CoffeeRewardAgent {
  private agent: CdpAgent;
  private agentkit: CdpAgentkit;

  constructor() {
    // Initialize CDP Agent Kit with Server Wallet integration
    this.agentkit = CdpAgentkit.configureWithWallet({
      cdpApiKeyName: process.env.CDP_API_KEY_NAME!,
      cdpApiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY!,
      networkId: 'base-mainnet', // or base-sepolia for testing
      useServerSigner: true // Enable server-side signing
    });

    // Create agent with blockchain capabilities
    this.agent = new CdpAgent({
      agentkit: this.agentkit,
      model: 'gpt-4o-mini',
      systemPrompt: `
        You are a coffee validation expert and blockchain reward distributor.
        
        Your role:
        1. Analyze coffee photos for authenticity and quality
        2. Validate location data matches the photo
        3. Distribute BEAN token rewards based on validation results
        4. Handle special cases like first-time venues or streak bonuses
        
        Validation criteria:
        - Photo must show actual coffee/coffee shop setting
        - Location must be reasonable (not residential/fake)
        - Quality assessment: lighting, composition, authenticity
        
        Reward structure:
        - Base reward: 10 BEAN tokens
        - Quality bonus: +5 BEAN for exceptional photos
        - New venue bonus: +10 BEAN for first post at location
        - Streak bonus: +2 BEAN per day in current streak
        
        Always explain your reasoning and provide confidence scores.
      `
    });
  }

  /**
   * Validate coffee snap and distribute rewards autonomously
   */
  async validateAndReward(params: {
    imageUrl: string;
    userAddress: string;
    venueName: string;
    city: string;
    state: string;
    coffeeType: string;
    userStreak?: number;
    isNewVenue?: boolean;
  }) {
    try {
      const prompt = `
        Validate this coffee snap and distribute appropriate BEAN token rewards:
        
        Image: ${params.imageUrl}
        User: ${params.userAddress}
        Location: ${params.venueName} in ${params.city}, ${params.state}
        Coffee: ${params.coffeeType}
        Current streak: ${params.userStreak || 0} days
        New venue: ${params.isNewVenue ? 'Yes' : 'No'}
        
        Steps:
        1. Analyze the image for coffee authenticity (confidence score 0-100)
        2. Validate location reasonableness
        3. Calculate total reward amount based on criteria
        4. Transfer BEAN tokens to user address: ${params.userAddress}
        5. Provide detailed validation report
        
        Token contract address: ${process.env.BEAN_TOKEN_ADDRESS}
      `;

      const response = await this.agent.invoke([new HumanMessage(prompt)]);
      
      return {
        success: true,
        validation: response,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Reward agent error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Create autonomous coffee shop wallet and setup
   */
  async setupCoffeeShop(params: {
    venueName: string;
    city: string;
    state: string;
    placeId: string;
  }) {
    const prompt = `
      Setup a new coffee shop in our network:
      
      Name: ${params.venueName}
      Location: ${params.city}, ${params.state}
      Place ID: ${params.placeId}
      
      Tasks:
      1. Create a new CDP wallet for this venue
      2. Deploy an NFT coupon contract for loyalty rewards
      3. Set initial parameters: 10 coffees = 1 coupon
      4. Fund wallet with small amount for gas fees
      5. Return wallet address and contract details
    `;

    try {
      const response = await this.agent.invoke([new HumanMessage(prompt)]);
      return {
        success: true,
        setup: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Coffee shop setup error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle coupon redemption validation
   */
  async validateCouponRedemption(params: {
    userAddress: string;
    couponTokenId: string;
    venueName: string;
    redemptionCode: string;
  }) {
    const prompt = `
      Validate and process coupon redemption:
      
      User: ${params.userAddress}
      Coupon NFT ID: ${params.couponTokenId}
      Venue: ${params.venueName}
      Redemption code: ${params.redemptionCode}
      
      Steps:
      1. Verify user owns the coupon NFT
      2. Check coupon hasn't been redeemed already
      3. Validate redemption code matches venue
      4. Mark coupon as redeemed (transfer to burn address or update metadata)
      5. Log redemption for analytics
    `;

    try {
      const response = await this.agent.invoke([new HumanMessage(prompt)]);
      return {
        success: true,
        redemption: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Coupon redemption error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Autonomous tip optimization suggestions
   */
  async optimizeTipping(params: {
    fromUser: string;
    toCreator: string;
    creatorEngagement: number;
    suggestedAmount: number;
  }) {
    const prompt = `
      Optimize tip amount for maximum engagement impact:
      
      From: ${params.fromUser}
      To Creator: ${params.toCreator}
      Creator engagement score: ${params.creatorEngagement}
      Suggested amount: $${params.suggestedAmount}
      
      Consider:
      1. Creator's recent activity and engagement
      2. Optimal tip amounts for this creator tier
      3. User's tipping history and patterns
      4. Current USDC balance and spending capacity
      
      Provide optimized tip amount and reasoning.
    `;

    try {
      const response = await this.agent.invoke([new HumanMessage(prompt)]);
      return {
        success: true,
        optimization: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Tip optimization error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const coffeeRewardAgent = new CoffeeRewardAgent();