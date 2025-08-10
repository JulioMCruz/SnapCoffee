import { Router } from 'express';
import multer from 'multer';
import { CoffeeController } from '@/controllers/coffee';

const router = Router();
const coffeeController = new CoffeeController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * POST /api/coffee/validate-snap
 * Validate and process a coffee snap
 * Body: { userId, fid, location, description }
 * File: image upload
 */
router.post('/validate-snap', 
  upload.single('image'),
  coffeeController.validateSnap
);

/**
 * POST /api/coffee/submit-snap
 * Submit a validated coffee snap (with base64 image)
 * Body: { userId, fid, imageData, location, description }
 */
router.post('/submit-snap', coffeeController.submitSnap);

/**
 * GET /api/coffee/feed
 * Get paginated coffee snap feed
 * Query: { page?, limit?, userId?, venueId? }
 */
router.get('/feed', coffeeController.getFeed);

/**
 * GET /api/coffee/user/:userId/snaps
 * Get user's coffee snaps
 * Query: { page?, limit? }
 */
router.get('/user/:userId/snaps', coffeeController.getUserSnaps);

/**
 * GET /api/coffee/venues/nearby
 * Get nearby coffee venues
 * Query: { lat, lng, radius? }
 */
router.get('/venues/nearby', coffeeController.getNearbyVenues);

/**
 * GET /api/coffee/venues/:venueId/stats
 * Get venue statistics
 */
router.get('/venues/:venueId/stats', coffeeController.getVenueStats);

/**
 * GET /api/coffee/leaderboard
 * Get coffee snap leaderboard
 * Query: { timeframe?, limit? }
 */
router.get('/leaderboard', coffeeController.getLeaderboard);

export default router;