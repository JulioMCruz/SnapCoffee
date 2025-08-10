import { Router } from 'express';
import { AgentController } from '@/controllers/agent';

const router = Router();
const agentController = new AgentController();

/**
 * @route   POST /api/agents/validate-snap
 * @desc    AI-powered coffee snap validation with automatic rewards
 * @body    { imageUrl, userAddress, venueName, city, state, coffeeType, userStreak?, isNewVenue? }
 * @access  Public (in production, should be authenticated)
 */
router.post('/validate-snap', agentController.validateAndReward.bind(agentController));

/**
 * @route   POST /api/agents/setup-coffee-shop
 * @desc    Autonomous coffee shop wallet and contract setup
 * @body    { venueName, city, state, placeId }
 * @access  Admin only (in production)
 */
router.post('/setup-coffee-shop', agentController.setupCoffeeShop.bind(agentController));

/**
 * @route   POST /api/agents/validate-coupon-redemption
 * @desc    Validate and process NFT coupon redemption
 * @body    { userAddress, couponTokenId, venueName, redemptionCode }
 * @access  Public (in production, should be authenticated)
 */
router.post('/validate-coupon-redemption', agentController.validateCouponRedemption.bind(agentController));

/**
 * @route   POST /api/agents/optimize-tip
 * @desc    Get AI-optimized tip amount suggestion
 * @body    { fromUser, toCreator, creatorEngagement, suggestedAmount }
 * @access  Public (in production, should be authenticated)
 */
router.post('/optimize-tip', agentController.optimizeTipping.bind(agentController));

/**
 * @route   POST /api/agents/mint-coupon
 * @desc    Mint NFT coupon for user via server wallet
 * @body    { userAddress, storeId, storeName, reason }
 * @access  Public (in production, should be authenticated)
 */
router.post('/mint-coupon', agentController.mintCoupon.bind(agentController));

export default router;