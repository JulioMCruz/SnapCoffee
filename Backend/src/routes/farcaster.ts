import { Router } from 'express';
import { validateFarcasterWebhook } from '@/middleware';
import { FarcasterController } from '@/controllers/farcaster';

const router = Router();
const farcasterController = new FarcasterController();

/**
 * POST /api/farcaster/webhook
 * Handle Farcaster Mini App webhooks
 */
router.post('/webhook', 
  validateFarcasterWebhook,
  farcasterController.handleWebhook
);

/**
 * GET /api/farcaster/user/:fid
 * Get user profile data from Farcaster
 */
router.get('/user/:fid', farcasterController.getUserProfile);

/**
 * POST /api/farcaster/validate-user
 * Validate Farcaster user authentication
 */
router.post('/validate-user', farcasterController.validateUser);

/**
 * POST /api/farcaster/log-connection
 * Log user connection events for analytics
 */
router.post('/log-connection', farcasterController.logUserConnection);

export default router;