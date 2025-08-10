import { Router } from 'express';
import { OnrampController } from '@/controllers/onramp';
import { authenticateApiKey, optionalAuth } from '@/middleware/auth';

const router = Router();
const onrampController = new OnrampController();

/**
 * POST /api/onramp/create-session
 * Create CDP Onramp session for fiat-to-crypto conversion
 * Body: { userId, amount, currency, destinationWallet }
 */
router.post('/create-session', authenticateApiKey, onrampController.createSession);

/**
 * GET /api/onramp/session/:sessionId
 * Get onramp session status
 */
router.get('/session/:sessionId', onrampController.getSessionStatus);

/**
 * POST /api/onramp/webhook
 * Handle CDP Onramp webhooks
 */
router.post('/webhook', onrampController.handleWebhook);

/**
 * GET /api/onramp/user/:userId/sessions
 * Get user's onramp sessions
 * Query: { page?, limit?, status? }
 */
router.get('/user/:userId/sessions', onrampController.getUserSessions);

/**
 * POST /api/onramp/tip
 * Process tip transaction via onramp
 * Body: { fromUserId, toUserId, amount, currency }
 */
router.post('/tip', authenticateApiKey, onrampController.processTip);

export default router;