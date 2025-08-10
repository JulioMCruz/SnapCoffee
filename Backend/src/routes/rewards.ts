import { Router } from 'express';
import { RewardsController } from '@/controllers/rewards';

const router = Router();
const rewardsController = new RewardsController();

/**
 * POST /api/rewards/mint
 * Mint $BEAN tokens as rewards
 * Body: { userId, amount, reason, metadata? }
 */
router.post('/mint', rewardsController.mintRewards);

/**
 * GET /api/rewards/user/:userId/balance
 * Get user's $BEAN token balance
 */
router.get('/user/:userId/balance', rewardsController.getUserBalance);

/**
 * GET /api/rewards/user/:userId/history
 * Get user's reward history
 * Query: { page?, limit? }
 */
router.get('/user/:userId/history', rewardsController.getRewardHistory);

/**
 * POST /api/rewards/claim
 * Claim pending rewards
 * Body: { userId, rewardIds[] }
 */
router.post('/claim', rewardsController.claimRewards);

/**
 * GET /api/rewards/milestones/:userId
 * Get user's milestone progress
 */
router.get('/milestones/:userId', rewardsController.getMilestones);

/**
 * GET /api/rewards/stats
 * Get global reward statistics
 */
router.get('/stats', rewardsController.getRewardStats);

export default router;