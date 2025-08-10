# Snap Coffee Backend API

> Node.js/Express backend for Snap Coffee - Web3 Social Coffee Loyalty Platform

## 🚀 Quick Start

### Prerequisites
```bash
node >= 18.0.0
npm >= 8.0.0
```

### Installation
```bash
# Clone and navigate to backend
cd Backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Development
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run type-check

# Lint code
npm run lint
```

## 📋 API Endpoints

### Health Check
```
GET /api/health
```

### Farcaster Integration
```
POST /api/farcaster/webhook         # Handle Mini App webhooks
GET  /api/farcaster/user/:fid       # Get user profile
POST /api/farcaster/validate-user   # Validate user auth
```

### Coffee Snaps
```
POST /api/coffee/validate-snap      # Validate coffee image (multipart)
POST /api/coffee/submit-snap        # Submit coffee snap (base64)
GET  /api/coffee/feed               # Get paginated feed
GET  /api/coffee/user/:userId/snaps # Get user's snaps
GET  /api/coffee/venues/nearby      # Get nearby venues
GET  /api/coffee/venues/:id/stats   # Get venue statistics
GET  /api/coffee/leaderboard        # Get snap leaderboard
```

### Rewards & Tokens
```
POST /api/rewards/mint              # Mint $BEAN tokens
GET  /api/rewards/user/:userId/balance     # Get token balance
GET  /api/rewards/user/:userId/history     # Get reward history
POST /api/rewards/claim             # Claim pending rewards
GET  /api/rewards/milestones/:userId       # Get milestone progress
GET  /api/rewards/stats             # Global reward stats
```

### NFT Coupons
```
POST /api/coupons/mint              # Mint NFT coupon
GET  /api/coupons/user/:userId      # Get user's coupons
POST /api/coupons/redeem            # Redeem coupon
GET  /api/coupons/:couponId         # Get coupon details
POST /api/coupons/validate-redemption      # Validate for venue
GET  /api/coupons/venue/:venueId/redeemed  # Venue redemptions
```

### CDP Onramp
```
POST /api/onramp/create-session     # Create fiat-to-crypto session
GET  /api/onramp/session/:sessionId # Get session status
POST /api/onramp/webhook            # Handle onramp webhooks
GET  /api/onramp/user/:userId/sessions     # User's sessions
POST /api/onramp/tip                # Process tip transaction
```

## 🏗️ Architecture

### Directory Structure
```
Backend/
├── src/
│   ├── config/           # Environment & app configuration
│   ├── controllers/      # Route handlers and business logic
│   ├── middleware/       # Express middleware (auth, validation, etc.)
│   ├── routes/          # API route definitions
│   ├── services/        # External service integrations
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions and helpers
│   └── index.ts         # Express app entry point
├── uploads/             # Local file storage (development)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── .env.example         # Environment variables template
```

### Core Services

#### CDP Wallet Service
- **Coinbase Developer Platform integration**
- **Automated token minting ($BEAN rewards)**
- **NFT coupon generation**
- **Base network transactions**

```typescript
// Example usage
const cdpWallet = new CDPWalletService();
const txHash = await cdpWallet.mintTokens(
  LOYALTY_TOKEN_ADDRESS,
  userAddress,
  '10' // 10 $BEAN tokens
);
```

#### Image Validation Service
- **AI-powered coffee detection**
- **Heuristic analysis fallback**
- **Duplicate image prevention**
- **Image quality validation**

```typescript
const imageService = new ImageValidationService();
const validation = await imageService.validateCoffeeImage(
  imageBuffer,
  'image/jpeg'
);
```

#### Storage Service
- **AWS S3 integration**
- **Local filesystem fallback**
- **Image optimization**
- **Thumbnail generation**

## ⚙️ Configuration

### Required Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3001

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
LOYALTY_TOKEN_ADDRESS=0x...
COUPON_NFT_ADDRESS=0x...

# CDP (Coinbase Developer Platform)
CDP_API_KEY=your_api_key
CDP_API_SECRET=your_api_secret
CDP_WALLET_ID=your_wallet_id

# Storage (AWS S3)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=snap-coffee-images

# AI/Validation
OPENAI_API_KEY=your_openai_key
GOOGLE_PLACES_API_KEY=your_places_key
```

### Feature Flags
```bash
FEATURE_AI_VALIDATION=true      # Enable AI image validation
FEATURE_AUTO_REWARDS=true       # Auto-mint rewards
FEATURE_ONRAMP_INTEGRATION=true # Enable fiat-to-crypto
FEATURE_ANALYTICS=true          # Enable usage analytics
```

## 🔧 Smart Contract Integration

### Required Contracts on Base Network

1. **LoyaltyToken (ERC20)** - $BEAN reward tokens
2. **CouponNFT (ERC721)** - Redeemable coffee coupons  
3. **SnapRegistry** - Event logging and state management

### CDP Wallet Setup

1. Get Coinbase Developer Platform API credentials
2. Create server wallet for automated transactions
3. Fund wallet with ETH for gas fees
4. Deploy smart contracts to Base network

```bash
# Initialize CDP wallet
npm run dev
# Check logs for wallet ID, add to .env file
```

## 🛡️ Security

### Authentication
- Farcaster signature validation
- Rate limiting (100 req/15min)
- CORS protection
- Input validation with Zod schemas

### Smart Contract Security
- Server wallet with restricted permissions
- Multi-signature for large transactions
- Gas limit controls
- Transaction monitoring

### Data Privacy
- Hashed venue IDs (no raw GPS coordinates)
- Image content hashing
- User data encryption at rest

## 📊 Monitoring

### Health Checks
```bash
curl http://localhost:3001/api/health
```

### Logging
- Request/response logging with Morgan
- Error tracking and stack traces
- Performance metrics
- Smart contract event monitoring

### Metrics Tracked
- API response times
- Image validation accuracy
- Reward distribution rates
- NFT minting success rates
- User engagement patterns

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
- **Railway/Render**: Node.js deployment
- **AWS/GCP**: Container or serverless
- **Vercel**: Serverless functions
- **Docker**: Container deployment

### Database Integration (Future)
```bash
# PostgreSQL with Prisma ORM
DATABASE_URL=postgresql://user:pass@host:5432/snapcoffee
```

## 🤝 Integration with Frontend

### CORS Configuration
The backend automatically allows requests from:
- `http://localhost:8080` (local development)
- `https://snapcoffee.xyz` (production)
- `https://codalabs.ngrok.io` (ngrok testing)

### API Response Format
```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 🔍 Testing

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Coffee snap validation
curl -X POST http://localhost:3001/api/coffee/validate-snap \
  -F "image=@coffee.jpg" \
  -F "userId=user123" \
  -F "fid=123456" \
  -F "location={\"venueId\":\"venue123\",\"venueName\":\"Blue Bottle\"}"
```

### Development with Frontend
1. Start backend: `npm run dev` (port 3001)
2. Start frontend: `npm run dev` (port 8080)
3. Backend automatically handles CORS for local development

## 📈 Roadmap

### Phase 1 (Current)
- ✅ Basic API structure
- ✅ Farcaster webhook handling
- ✅ Image validation system
- ✅ CDP wallet integration
- 🔄 Smart contract deployment

### Phase 2
- 🔄 PostgreSQL database integration
- 🔄 Real AI image validation (OpenAI Vision)
- 🔄 Google Places API integration
- 🔄 Advanced analytics

### Phase 3
- 🔄 Redis caching layer
- 🔄 Advanced fraud detection
- 🔄 Multi-venue partnerships
- 🔄 Mobile push notifications

---

**Need Help?** Check the [main project README](../README.md) or create an issue.