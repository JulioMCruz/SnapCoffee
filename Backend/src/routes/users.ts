import { Router } from 'express';
import {
  getCreators,
  getUserByFid,
  getUserBalance,
  sendTip,
  updateBalanceAfterOnramp
} from '@/controllers/users';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

/**
 * @route   GET /api/users/creators
 * @desc    Get all coffee creators/influencers
 * @query   search, sortBy, limit
 * @access  Public
 */
router.get('/creators', getCreators);

/**
 * @route   GET /api/users/:fid
 * @desc    Get user by Farcaster ID
 * @param   fid - Farcaster ID
 * @access  Public
 */
router.get('/:fid', getUserByFid);

/**
 * @route   GET /api/users/balance
 * @desc    Get current user's USDC balance
 * @query   address - User's wallet address
 * @access  Public (in production, should be authenticated)
 */
router.get('/balance', getUserBalance);

/**
 * @route   POST /api/users/tips/send
 * @desc    Send USDC tip to another user
 * @body    { toUserId, amount, fromAddress }
 * @access  Public (in production, should be authenticated)
 */
router.post('/tips/send', sendTip);

/**
 * @route   POST /api/users/balance/onramp
 * @desc    Update user balance after successful onramp
 * @body    { address, amount, transactionId }
 * @access  Public (in production, should be authenticated and verify transaction)
 */
router.post('/balance/onramp', updateBalanceAfterOnramp);

export default router;