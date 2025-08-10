import express from 'express';
import { config } from '@/config';
import {
  corsMiddleware,
  securityMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
  errorMiddleware,
  notFoundMiddleware,
  healthCheckMiddleware,
  requestIdMiddleware,
} from '@/middleware';

// Import routes (we'll create these next)
import farcasterRoutes from '@/routes/farcaster';
import coffeeRoutes from '@/routes/coffee';
import rewardsRoutes from '@/routes/rewards';
import couponsRoutes from '@/routes/coupons';
import onrampRoutes from '@/routes/onramp';

const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Core middleware
app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(securityMiddleware);
app.use(loggingMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimitMiddleware());

// Health check endpoint
app.get(config.HEALTH_CHECK_ENDPOINT, healthCheckMiddleware);

// API routes
app.use('/api/farcaster', farcasterRoutes);
app.use('/api/coffee', coffeeRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/coupons', couponsRoutes);
app.use('/api/onramp', onrampRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Snap Coffee Backend API',
    version: config.APP_VERSION,
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: config.HEALTH_CHECK_ENDPOINT,
      farcaster: '/api/farcaster',
      coffee: '/api/coffee',
      rewards: '/api/rewards',
      coupons: '/api/coupons',
      onramp: '/api/onramp',
    },
  });
});

// Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);

// Graceful shutdown handler
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.log('Forcing shutdown');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(config.PORT, config.HOST, () => {
  console.log(`
🚀 Snap Coffee Backend API
📍 Running on: http://${config.HOST}:${config.PORT}
🌍 Environment: ${config.NODE_ENV}
🔗 Health Check: ${config.HEALTH_CHECK_ENDPOINT}
⚡ Features:
   - AI Validation: ${config.FEATURES.AI_VALIDATION}
   - Auto Rewards: ${config.FEATURES.AUTO_REWARDS}
   - Onramp Integration: ${config.FEATURES.ONRAMP_INTEGRATION}
   - Analytics: ${config.FEATURES.ANALYTICS}

📋 Available Endpoints:
   - POST /api/farcaster/webhook
   - POST /api/coffee/validate-snap
   - GET  /api/coffee/feed
   - POST /api/rewards/mint
   - POST /api/coupons/mint
   - POST /api/onramp/create-session
  `);
});

// Handle graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;