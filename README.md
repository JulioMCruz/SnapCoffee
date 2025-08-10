# Snap Coffee - On-Chain Loyalty Platform on Base 

> Social mini app turning daily coffee habits into Web3 engagement for 1 billion+ coffee drinkers worldwide

[![Base Network](https://img.shields.io/badge/Built%20on-Base-0052FF)](https://base.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-orange)](#roadmap)

---

## **Snap Coffee is Based**

Snap Coffee is a social mini app and on-chain loyalty platform built on **Base** to onboard millions of new Web3 users by targeting one of the largest and most passionate global consumer segments: **daily coffee drinkers,** over **1 billion people worldwide**.

We start with a simple, familiar action: taking a photo of your coffee. Every verified coffee purchase earns on-chain points, and after 10 coffees, users receive an **NFT coupon** for their 11th coffee, instantly redeemable at participating cafés.

## The Problem

Traditional loyalty programs are broken:

- **Paper cards get lost, damaged, or forgotten** 📄❌
- **Café owners lack reliable customer data and insights** 📊❌  
- **Loyalty isn't engaging** — it's transactional and disconnected from the coffee culture ☕❌

## The Solution

Using **Base** for low-cost, fast, and scalable transactions, Snap Coffee creates a **geolocated, on-chain customer database** enriched with demographic insights. This enables café owners to:

- ⚡ **Track visits in real time**
- 🎯 **Understand customer behavior** by location, time of day, and preferences  
- 🚀 **Run targeted marketing campaigns** and personalized rewards

## Sustainable Business Model

Snap Coffee generates revenue through:

1. **💼 B2B SaaS subscriptions** for cafés to access loyalty, analytics, and marketing tools
2. **💳 Transaction fees** for each redeemed NFT coupon
3. **🎪 Brand sponsorships** from coffee, equipment, and lifestyle companies

By fixing the **loyalty gap** and creating a shareable, gamified coffee culture, Snap Coffee drives mass adoption of Base, turning a daily habit into global on-chain engagement.

---

## ✨ Key Features

### For Coffee Lovers 👥
- 📸 **Instagram-style Coffee Feed** - Share and discover local coffee culture  
- 🪙 **Earn $BEAN Tokens** - Get rewards for every verified coffee purchase
- 🎫 **NFT Coupon Rewards** - Redeem your 11th coffee with blockchain-backed coupons
- 💰 **Creator Tipping** - Support coffee influencers with fiat-to-crypto payments
- 🏆 **Social Rankings** - Compete on local coffee leaderboards

### For Coffee Shops ☕
- 📊 **Real-time Analytics Dashboard** - Track visits, peak hours, popular drinks
- 🎯 **Customer Insights** - Understand demographics, preferences, and behavior patterns
- 🎪 **Marketing Campaigns** - Run targeted promotions and loyalty programs  
- 💎 **NFT Coupon System** - Automated redemption with fraud protection
- 📈 **Revenue Growth** - Increase customer retention and average visit value

### For the Ecosystem 🌍
- 🔗 **Web3 Onboarding** - Seamless transition from Web2 to Web3 through familiar actions
- ⚡ **Base Network Integration** - Fast, cheap transactions for global scale
- 🛡️ **Privacy-First** - Location data hashed, no raw GPS coordinates on-chain
- 🤖 **AI Content Moderation** - Automated fraud detection and quality control

---

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: OnchainKit for wallet integration (planned)
- **State**: React Query + local storage
- **Mobile**: PWA-ready responsive design

### Smart Contracts (Base Network)
```solidity
LoyaltyToken.sol      // ERC20 $BEAN rewards system
RewardsController.sol // Coffee verification & reward distribution
CouponNFT.sol         // ERC721 redeemable coffee coupons  
SnapRegistry.sol      // Event logging and verification
```

#### Deployed Contracts (Base Sepolia Testnet)

| Contract | Address | BaseScan Explorer | Status |
|----------|---------|-------------------|--------|
| **$BEAN Token** | `0xC74C0f76acA119B8e68F7A4f7580E80f0BE42752` | [View Contract →](https://sepolia.basescan.org/address/0xC74C0f76acA119B8e68F7A4f7580E80f0BE42752#code) | ✅ Verified |
| **RewardsController** | `0xE3b30Cc77dfbEBC69C3c1e40703C792A934dE834` | [View Contract →](https://sepolia.basescan.org/address/0xE3b30Cc77dfbEBC69C3c1e40703C792A934dE834#code) | ✅ Verified |

**Key Features:**
- 🪙 **$BEAN Token**: ERC20 rewards with 3 BEAN per verified coffee
- 🛡️ **Anti-fraud**: Daily limits (10 coffees/user), 30min cooldowns per location
- 👥 **Merchant System**: Registration and analytics for coffee shops
- 🔍 **Full Transparency**: Complete source code verified on BaseScan

### Backend Services (Planned)
- **Runtime**: Node.js + TypeScript
- **Wallet**: Coinbase Developer Platform Server Wallet v2
- **AI**: Content moderation and fraud detection
- **Payments**: CDP Onramp for fiat-to-crypto tipping
- **Storage**: IPFS/S3 for media with on-chain content hashes

### Data Layer
- **Indexing**: CDP Data SQL API for on-chain events
- **Events**: SnapPosted, RewardGranted, CouponRedeemed, Tipped
- **Privacy**: Venue IDs (hashed) instead of raw coordinates
- **Analytics**: Real-time dashboard for coffee shop insights

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm/yarn/pnpm

### Quick Start
```bash
# Clone the repository
git clone https://github.com/your-username/snap-coffee
cd snap-coffee

# Navigate to frontend
cd FrontEnd

# Install dependencies  
npm install

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build  
npm run lint         # Run ESLint
```

---

## 📱 User Journey

### 1. **Onboard** 🚀
- Connect wallet via OnchainKit (smart wallet creation)
- Grant location permissions or manual café search
- Explore local coffee feed powered by CDP Data API

### 2. **Snap & Share** 📸
- Take coffee photo with camera integration
- Select café location with auto-suggestion
- Add coffee type, rating, and pairing recommendation
- AI validation + on-chain event logging

### 3. **Earn & Progress** 🎯
- Receive $BEAN tokens for verified posts
- Track progress toward 10-coffee milestone  
- Social engagement through likes and tips

### 4. **Redeem Rewards** 🎫
- Automatic NFT coupon minting at 10 coffees
- QR code redemption at participating cafés
- On-chain verification and fraud protection

### 5. **Tip Creators** 💰
- Support coffee influencers with fiat payments
- CDP Onramp converts to USDC on Base
- Transparent tipping leaderboards

---

## 🛣️ Development Roadmap

### Phase 1: MVP Foundation ✅
- [x] React frontend with mobile-first UI
- [x] Camera integration and photo workflow
- [x] Progress tracking and localStorage persistence  
- [x] Instagram-style feed with coffee cards
- [x] Base network smart contracts (BEAN Token + RewardsController)
- [ ] OnchainKit wallet integration

### Phase 2: Web3 Integration 🔄
- [x] ERC20 $BEAN token implementation (3 BEAN per coffee reward)
- [x] Smart contract rewards controller with anti-fraud protection
- [ ] ERC721 NFT coupon system
- [ ] CDP Server Wallet automation
- [ ] On-chain event logging integration
- [ ] Real-time feed from blockchain data

### Phase 3: Monetization & Scale 📈
- [ ] CDP Onramp fiat-to-crypto tipping
- [ ] AI content moderation pipeline
- [ ] Coffee shop analytics dashboard
- [ ] B2B SaaS subscription system
- [ ] Brand partnership integration

### Phase 4: Growth & Optimization 🚀
- [ ] Mobile app (React Native/PWA)
- [ ] Advanced gamification features
- [ ] Multi-language support  
- [ ] Enterprise café management tools
- [ ] Cross-chain compatibility research

---

## 🏪 Business Model Deep Dive

### Revenue Streams

#### 1. B2B SaaS Subscriptions 💼
**Target**: Independent cafés and small chains  
**Pricing**: $49-199/month per location
- Basic analytics and loyalty tools
- Customer demographic insights  
- Marketing campaign management
- NFT coupon redemption system

#### 2. Transaction Fees 💳
**Model**: 2-3% fee on NFT coupon redemptions
- Automated fee collection via smart contracts
- Volume discounts for high-traffic locations
- Premium features unlock at higher tiers

#### 3. Brand Sponsorships 🎪
**Partners**: Coffee brands, equipment manufacturers, lifestyle companies
- Sponsored content in coffee feed
- Branded NFT coupon designs
- Influencer partnership programs
- Event and campaign sponsorships

### Market Opportunity

- **Total Addressable Market**: $45B+ global coffee shop market
- **Daily Active Users Potential**: 100M+ coffee drinkers worldwide
- **Web3 Adoption**: Bridge mainstream users to Base ecosystem
- **Network Effects**: Each new café and user increases platform value

---

## 🤝 Contributing

We welcome contributions to make Snap Coffee the leading Web3 loyalty platform!

### Development Process
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)  
5. **Open** a Pull Request

### Code Standards
- TypeScript for type safety
- ESLint + Prettier for code formatting
- Comprehensive testing for smart contracts
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Links & Resources

- **🌐 Website**: [snapcoffee.xyz](https://snapcoffee.xyz) *(coming soon)*
- **📱 App**: [Download from App Store](https://apps.apple.com/app/snap-coffee) *(coming soon)*  
- **🐦 Twitter**: [@SnapCoffeeBase](https://twitter.com/SnapCoffeeBase)
- **💬 Discord**: [Join Community](https://discord.gg/snapcoffee)
- **📧 Contact**: hello@snapcoffee.xyz
- **🔗 Base**: [Built on Base](https://base.org)

---

<div align="center">

**Built with ❤️ for the coffee community on [Base](https://base.org)**

*Turning daily coffee moments into on-chain memories, one snap at a time.*

</div>