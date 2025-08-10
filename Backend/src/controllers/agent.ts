import { Request, Response } from 'express';
import { ApiResponse } from '@/types';
import { coffeeRewardAgent } from '@/agents/reward-agent';

export class AgentController {
  /**
   * AI-powered coffee snap validation with automatic reward distribution
   */
  async validateAndReward(req: Request, res: Response) {
    try {
      const {
        imageUrl,
        userAddress,
        venueName,
        city,
        state,
        coffeeType,
        userStreak = 0,
        isNewVenue = false
      } = req.body;

      // Validation
      if (!imageUrl || !userAddress || !venueName || !city || !state || !coffeeType) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: imageUrl, userAddress, venueName, city, state, coffeeType'
        };
        return res.status(400).json(response);
      }

      // Use CDP Agent Kit for autonomous validation and reward distribution
      const result = await coffeeRewardAgent.validateAndReward({
        imageUrl,
        userAddress,
        venueName,
        city,
        state,
        coffeeType,
        userStreak,
        isNewVenue
      });

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: {
            validation: result.validation,
            timestamp: result.timestamp,
            agent: 'CDP Agent Kit',
            autonomous: true
          },
          message: 'Coffee snap validated and rewards distributed by AI agent'
        };
        return res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Agent Error',
          message: result.error || 'AI agent validation failed'
        };
        return res.status(500).json(response);
      }

    } catch (error) {
      console.error('Agent validate and reward error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Autonomous coffee shop setup with CDP wallet creation
   */
  async setupCoffeeShop(req: Request, res: Response) {
    try {
      const { venueName, city, state, placeId } = req.body;

      if (!venueName || !city || !state || !placeId) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: venueName, city, state, placeId'
        };
        return res.status(400).json(response);
      }

      const result = await coffeeRewardAgent.setupCoffeeShop({
        venueName,
        city,
        state,
        placeId
      });

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: {
            setup: result.setup,
            timestamp: result.timestamp,
            agent: 'CDP Agent Kit',
            autonomous: true
          },
          message: 'Coffee shop setup completed by AI agent'
        };
        return res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Agent Error',
          message: result.error || 'AI agent setup failed'
        };
        return res.status(500).json(response);
      }

    } catch (error) {
      console.error('Agent setup coffee shop error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Validate and process NFT coupon redemption
   */
  async validateCouponRedemption(req: Request, res: Response) {
    try {
      const { userAddress, couponTokenId, venueName, redemptionCode } = req.body;

      if (!userAddress || !couponTokenId || !venueName || !redemptionCode) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: userAddress, couponTokenId, venueName, redemptionCode'
        };
        return res.status(400).json(response);
      }

      const result = await coffeeRewardAgent.validateCouponRedemption({
        userAddress,
        couponTokenId,
        venueName,
        redemptionCode
      });

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: {
            redemption: result.redemption,
            timestamp: result.timestamp,
            agent: 'CDP Agent Kit',
            autonomous: true
          },
          message: 'Coupon redemption processed by AI agent'
        };
        return res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Agent Error',
          message: result.error || 'AI agent redemption validation failed'
        };
        return res.status(500).json(response);
      }

    } catch (error) {
      console.error('Agent coupon redemption error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Get AI-optimized tip amount suggestions
   */
  async optimizeTipping(req: Request, res: Response) {
    try {
      const { fromUser, toCreator, creatorEngagement, suggestedAmount } = req.body;

      if (!fromUser || !toCreator || creatorEngagement === undefined || !suggestedAmount) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: fromUser, toCreator, creatorEngagement, suggestedAmount'
        };
        return res.status(400).json(response);
      }

      const result = await coffeeRewardAgent.optimizeTipping({
        fromUser,
        toCreator,
        creatorEngagement,
        suggestedAmount
      });

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: {
            optimization: result.optimization,
            timestamp: result.timestamp,
            agent: 'CDP Agent Kit',
            autonomous: true
          },
          message: 'Tip optimization completed by AI agent'
        };
        return res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Agent Error',
          message: result.error || 'AI agent tip optimization failed'
        };
        return res.status(500).json(response);
      }

    } catch (error) {
      console.error('Agent tip optimization error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }

  /**
   * Mint NFT coupon for user via server wallet
   */
  async mintCoupon(req: Request, res: Response) {
    try {
      const { userAddress, storeId, storeName, reason } = req.body;

      if (!userAddress || !storeId || !storeName || !reason) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: userAddress, storeId, storeName, reason'
        };
        return res.status(400).json(response);
      }

      // Use server wallet service to mint coupon
      const { cdpServerWalletService } = await import('@/services/cdp-server-wallet');
      
      const result = await cdpServerWalletService.distributeReward({
        userAddress,
        amount: 1, // 1 NFT
        rewardType: 'NFT_COUPON',
        storeId,
        reason
      });

      const response: ApiResponse = {
        success: true,
        data: {
          tokenId: result.transactionHash, // Use transaction hash as reference
          transactionHash: result.transactionHash,
          contractAddress: result.tokenAddress,
          storeId,
          storeName,
          reason,
          timestamp: new Date().toISOString()
        },
        message: `NFT coupon minted for ${storeName}`
      };
      
      return res.json(response);

    } catch (error) {
      console.error('Mint coupon error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
      res.status(500).json(response);
    }
  }
}