# Snap Coffee Smart Contracts

> Smart contracts for the Snap Coffee Web3 social loyalty platform on Base network

## Overview

This repository contains the smart contracts that power Snap Coffee, a Web3 social loyalty platform where users snap coffee photos, earn $BEAN tokens, and redeem NFT coupons. Built on Base network for low-cost, fast transactions.

## Contracts Architecture

### Core Contracts

| Contract | Purpose | Type | Key Features |
|----------|---------|------|--------------|
| `LoyaltyToken` | $BEAN reward token | ERC20 | Mintable, burnable, permit, daily limits |
| `RewardsController` | Coffee verification & rewards | Controller | Anti-fraud, reward distribution, merchant management |
| `CouponNFT` | Coffee coupon NFTs | ERC721 | Redeemable, expirable, venue-specific |
| `SnapRegistry` | Event logging & analytics | Registry | Anti-fraud, user stats, venue analytics |

### Deployed Contracts (Base Sepolia)

| Contract | Address | Explorer Link | Status |
|----------|---------|---------------|--------|
| **LoyaltyToken ($BEAN)** | `0xC74C0f76acA119B8e68F7A4f7580E80f0BE42752` | [View on BaseScan](https://sepolia.basescan.org/address/0xC74C0f76acA119B8e68F7A4f7580E80f0BE42752) | ✅ Deployed |
| **RewardsController** | `0xE3b30Cc77dfbEBC69C3c1e40703C792A934dE834` | [View on BaseScan](https://sepolia.basescan.org/address/0xE3b30Cc77dfbEBC69C3c1e40703C792A934dE834) | ✅ Deployed |

> **Note**: Contracts need to be verified on BaseScan. Add your `BASESCAN_API_KEY` to `.env` and run `npm run verify:base-sepolia`

### Contract Interactions

```
User snaps coffee → Backend validates → RewardsController.verifyCoffeeAndReward()
                                                    ↓
                                    Automatically mints 3 $BEAN tokens
                                                    ↓
User earns 10 coffees → Backend triggers → Mint NFT coupon
                                        ↓  
User redeems at venue → QR scan → Mark coupon as redeemed
```

## Quick Start

### Prerequisites

```bash
# Required tools
node >= 18
npm >= 9
```

### Installation

```bash
# Clone and install dependencies
git clone <repository>
cd SmartContracts
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Configuration

Required environment variables in `.env`:

```bash
# Essential
PRIVATE_KEY=your_private_key_here
ADMIN_ADDRESS=0x...
CDP_WALLET_ADDRESS=0x...

# Network & Verification
BASESCAN_API_KEY=your_basescan_api_key
NFT_BASE_URI=https://snapcoffee.xyz/api/metadata/
```

### Development Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Base Sepolia (testnet)
npm run deploy:base-sepolia

# Deploy to Base Mainnet
npm run deploy:base

# Verify contracts
npm run verify:base-sepolia
npm run verify:base
```

## Smart Contract Details

### LoyaltyToken ($BEAN)

**Features:**
- ERC20 standard with 18 decimals
- Maximum supply: 1 billion $BEAN
- Daily minting limits per minter (100,000 $BEAN)
- Role-based access control (admin, minter, burner, pauser)
- Gasless transactions via permit functionality

**Key Functions:**
```solidity
function mint(address to, uint256 amount, string reason) external;
function batchMint(address[] recipients, uint256[] amounts, string reason) external;
function getRemainingDailyMint(address minter) external view returns (uint256);
```

### RewardsController

**Features:**
- Coffee purchase verification and automatic reward distribution
- Anti-fraud mechanisms (daily limits, location cooldowns)
- Merchant registration and management
- User and merchant statistics tracking
- Integration with BEAN token for reward minting

**Key Functions:**
```solidity
function verifyCoffeeAndReward(address user, string locationId, bytes32 imageHash, uint256 timestamp) external;
function registerMerchant(address merchant, string locationId, string name) external;
function getUserStats(address user) external view returns (uint256, uint256, uint256, bool);
function canUserClaimAt(address user, string locationId) external view returns (bool, uint256);
```

**Configuration:**
- Coffee Reward: 3 BEAN tokens per verified coffee
- Daily Limit: 10 coffees per user per day
- Cooldown Period: 30 minutes between claims at same location

### CouponNFT

**Features:**
- ERC721 standard NFTs with metadata storage
- Maximum supply: 10 million coupons
- Expiration system (customizable per coupon)
- Venue-specific redemption restrictions
- Batch minting for efficiency

**Key Functions:**
```solidity
function mintCoupon(address to, uint256 coffeeShops, uint256 discount, uint256 expiryDays, string venueId) external returns (uint256);
function redeemCoupon(uint256 tokenId, string venueId) external;
function isValidForRedemption(uint256 tokenId) external view returns (bool, string);
```

### SnapRegistry

**Features:**
- Event logging for all platform activities
- User statistics and milestone tracking
- Venue analytics and verification
- Anti-fraud mechanisms (cooldowns, limits, duplicate detection)
- Blacklist management for bad actors

**Key Functions:**
```solidity
function recordSnap(address user, uint256 fid, string imageHash, string venueId, bool validated, uint256 reward) external returns (uint256);
function getUserMilestoneProgress(address user) external view returns (...);
function getVenueAnalytics(string venueId) external view returns (...);
```

## Deployment Guide

### Base Sepolia (Testnet)

```bash
# 1. Configure environment
export PRIVATE_KEY=your_private_key
export ADMIN_ADDRESS=0x...
export CDP_WALLET_ADDRESS=0x...

# 2. Fund your account with Sepolia ETH
# Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

# 3. Deploy contracts
npm run deploy:base-sepolia

# 4. Verify on BaseScan
npm run verify:base-sepolia
```

### Base Mainnet (Production)

```bash
# 1. Use secure private key management (hardware wallet recommended)
# 2. Consider using a multisig for ADMIN_ADDRESS
# 3. Ensure adequate ETH balance for deployment

npm run deploy:base
npm run verify:base
```

## Integration Guide

### Backend Integration

```typescript
// Example: Coffee verification and reward distribution
import { RewardsController } from './typechain-types';

async function rewardUserForCoffee(
  userAddress: string, 
  locationId: string, 
  imageHash: string, 
  timestamp: number
) {
  const rewardsController = new ethers.Contract(
    REWARDS_CONTROLLER_ADDRESS,
    RewardsControllerABI,
    cdpWallet
  ) as RewardsController;
  
  // This automatically mints 3 BEAN tokens to user if validation passes
  const tx = await rewardsController.verifyCoffeeAndReward(
    userAddress,
    locationId,
    imageHash,
    timestamp
  );
  await tx.wait();
}

// Example: Register a new merchant location
async function registerMerchantLocation(
  merchantAddress: string,
  locationId: string,
  name: string
) {
  const rewardsController = new ethers.Contract(
    REWARDS_CONTROLLER_ADDRESS,
    RewardsControllerABI,
    cdpWallet
  ) as RewardsController;
  
  const tx = await rewardsController.registerMerchant(
    merchantAddress,
    locationId,
    name
  );
  await tx.wait();
}
```

### Frontend Integration

```typescript
// Example: Reading user's coupon balance
import { CouponNFT } from './typechain-types';

async function getUserCoupons(userAddress: string) {
  const couponNFT = new ethers.Contract(
    COUPON_NFT_ADDRESS,
    CouponNFTABI,
    provider
  ) as CouponNFT;
  
  return await couponNFT.getUserValidCoupons(userAddress);
}
```

## Security Considerations

### Access Control

- **Admin Role**: Can pause contracts, manage roles, verify venues
- **Minter Role**: Can mint tokens/NFTs (assigned to CDP Server Wallet)
- **Recorder Role**: Can log events in SnapRegistry
- **Pauser Role**: Can pause contracts in emergencies

### Anti-Fraud Mechanisms

- **Cooldown Periods**: 1 hour minimum between snaps per user
- **Daily Limits**: Maximum 10 snaps per user per day
- **Image Hashing**: Prevents duplicate image submissions
- **Blacklist System**: Automatic blacklisting after 3 fraud reports

### Rate Limits

- **Token Minting**: 100,000 $BEAN per minter per day
- **Batch Operations**: Maximum 100 items per batch
- **Gas Optimization**: All operations optimized for Base network

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:integration
```

### Gas Analysis

```bash
REPORT_GAS=true npm run test
```

### Contract Size Analysis

```bash
npm run compile  # Automatically shows contract sizes
```

## Monitoring & Analytics

### Events to Monitor

```solidity
// Token events
event TokensMinted(address indexed to, uint256 amount, string reason);
event TokensBurned(address indexed from, uint256 amount);

// NFT events  
event CouponMinted(address indexed to, uint256 indexed tokenId, ...);
event CouponRedeemed(uint256 indexed tokenId, address indexed redeemedBy, ...);

// Registry events
event SnapRecorded(uint256 indexed snapId, address indexed user, ...);
event UserBlacklisted(address indexed user, string reason);
```

### Key Metrics to Track

- Daily/weekly token minting volume
- Coupon redemption rates
- User fraud detection accuracy
- Venue participation levels
- Contract gas usage patterns

## Troubleshooting

### Common Issues

**"Daily mint limit exceeded"**
- Check minter's remaining daily allowance with `getRemainingDailyMint()`
- Wait until next day (UTC) for limits to reset

**"Coupon already redeemed"**
- Verify coupon hasn't been used with `isValidForRedemption()`
- Check redemption history in events

**"User is blacklisted"**
- Check user's fraud reports in SnapRegistry
- Admin can investigate and potentially remove blacklist

### Gas Optimization

- Use batch operations when minting to multiple users
- Consider gas price timing for mainnet deployments
- Monitor Base network congestion for optimal transaction timing

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run linting: `npm run lint`
5. Run tests: `npm run test`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Resources

### Documentation
- [Base Network Docs](https://docs.base.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Hardhat Documentation](https://hardhat.org/docs)

### Tools
- [BaseScan Explorer](https://basescan.org/)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Coinbase CDP](https://docs.cdp.coinbase.com/)

---

**Project Status**: ✅ Production Ready  
**Network**: Base (Ethereum L2)  
**License**: MIT