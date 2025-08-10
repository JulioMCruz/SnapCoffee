import { Router } from 'express';
import { CouponsController } from '@/controllers/coupons';
import { authenticateApiKey, optionalAuth } from '@/middleware/auth';

const router = Router();
const couponsController = new CouponsController();

/**
 * POST /api/coupons/mint
 * Mint NFT coupon for eligible user
 * Body: { userId, metadata }
 */
router.post('/mint', authenticateApiKey, couponsController.mintCoupon);

/**
 * GET /api/coupons/user/:userId
 * Get user's NFT coupons
 * Query: { status?, page?, limit? }
 */
router.get('/user/:userId', couponsController.getUserCoupons);

/**
 * POST /api/coupons/redeem
 * Redeem NFT coupon
 * Body: { couponId, venueId, redeemCode }
 */
router.post('/redeem', authenticateApiKey, couponsController.redeemCoupon);

/**
 * GET /api/coupons/:couponId
 * Get coupon details
 */
router.get('/:couponId', optionalAuth, couponsController.getCouponDetails);

/**
 * POST /api/coupons/validate-redemption
 * Validate coupon for redemption (for venues)
 * Body: { couponId, venueId }
 */
router.post('/validate-redemption', authenticateApiKey, couponsController.validateRedemption);

/**
 * GET /api/coupons/venue/:venueId/redeemed
 * Get redeemed coupons for a venue
 * Query: { page?, limit? }
 */
router.get('/venue/:venueId/redeemed', couponsController.getVenueRedemptions);

export default router;