import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'BASE_RPC_URL',
  'CDP_API_KEY',
  'CDP_API_SECRET',
] as const;

// Validate environment variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test',
  PORT: parseInt(process.env.PORT || '3001', 10),
  HOST: process.env.HOST || '0.0.0.0',
  
  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'https://localhost:8080',
    'https://snapcoffee.xyz',
    'https://codalabs.ngrok.io',
  ],
  
  // Database Configuration (for future use)
  DATABASE_URL: process.env.DATABASE_URL,
  
  // Blockchain Configuration
  BASE_RPC_URL: process.env.BASE_RPC_URL!,
  BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
  CHAIN_ID: process.env.NODE_ENV === 'production' ? 8453 : 84532, // Base Mainnet : Base Sepolia
  
  // Smart Contract Addresses
  CONTRACTS: {
    LOYALTY_TOKEN: process.env.LOYALTY_TOKEN_ADDRESS || '',
    COUPON_NFT: process.env.COUPON_NFT_ADDRESS || '',
    SNAP_REGISTRY: process.env.SNAP_REGISTRY_ADDRESS || '',
  },
  
  // CDP (Coinbase Developer Platform) Configuration
  CDP_API_KEY: process.env.CDP_API_KEY!,
  CDP_API_SECRET: process.env.CDP_API_SECRET!,
  CDP_WALLET_ID: process.env.CDP_WALLET_ID,
  
  // Farcaster Configuration
  FARCASTER_WEBHOOK_SECRET: process.env.FARCASTER_WEBHOOK_SECRET,
  FARCASTER_API_KEY: process.env.FARCASTER_API_KEY,
  
  // AI/Image Processing
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,
  
  // File Storage
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'snap-coffee-images',
  
  // Google Places API (for venue data)
  GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
  
  // Firebase Admin Configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
  
  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100, // requests per window
  },
  
  // API Authentication
  JWT_SECRET: process.env.API_SECRET || process.env.JWT_SECRET || 'snap-coffee-dev-secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Webhook Configuration
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'snap-coffee-webhook-secret',
  
  // App Configuration
  APP_NAME: 'Snap Coffee Backend',
  APP_VERSION: '1.0.0',
  APP_URL: process.env.APP_URL || 'https://snapcoffee.xyz',
  
  // Feature Flags
  FEATURES: {
    AI_VALIDATION: process.env.FEATURE_AI_VALIDATION === 'true',
    AUTO_REWARDS: process.env.FEATURE_AUTO_REWARDS !== 'false', // Default true
    ONRAMP_INTEGRATION: process.env.FEATURE_ONRAMP_INTEGRATION === 'true',
    ANALYTICS: process.env.FEATURE_ANALYTICS !== 'false', // Default true
  },
  
  // Reward Configuration
  REWARDS: {
    COFFEE_SNAP_AMOUNT: process.env.REWARD_COFFEE_SNAP || '10', // 10 $BEAN per snap
    MILESTONE_AMOUNTS: {
      '10': '100', // 100 $BEAN for 10 snaps + NFT
      '25': '300', // 300 $BEAN for 25 snaps
      '50': '750', // 750 $BEAN for 50 snaps
      '100': '2000', // 2000 $BEAN for 100 snaps
    },
    COUPON_THRESHOLD: 10, // Snaps needed for NFT coupon
  },
  
  // Validation Thresholds
  VALIDATION: {
    AI_CONFIDENCE_THRESHOLD: 0.8, // 80% confidence required
    DUPLICATE_DETECTION_HOURS: 24, // Hours to check for duplicates
    MAX_SNAPS_PER_DAY: 10, // Anti-spam limit
  },
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  
  // Health Check
  HEALTH_CHECK_ENDPOINT: '/api/health',
} as const;

// Runtime validation
export function validateConfig(): void {
  if (config.PORT < 1000 || config.PORT > 65535) {
    throw new Error('PORT must be between 1000 and 65535');
  }
  
  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    throw new Error('NODE_ENV must be development, production, or test');
  }
  
  // Validate URLs
  try {
    new URL(config.BASE_RPC_URL);
  } catch {
    throw new Error('BASE_RPC_URL must be a valid URL');
  }
}

// Initialize configuration validation
validateConfig();

export default config;