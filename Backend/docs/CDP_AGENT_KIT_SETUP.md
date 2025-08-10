# CDP Agent Kit Integration Guide

Complete setup guide for integrating Coinbase Developer Platform Agent Kit into Snap Coffee.

## 🎯 Integration Points

### 1. **Autonomous Coffee Snap Validation** (Primary)
- AI agent validates coffee photos for authenticity
- Automatically distributes $BEAN token rewards
- Adjusts rewards based on quality, location rarity, and user streaks

### 2. **Smart Coffee Shop Management**
- Auto-creates CDP wallets for new venues
- Manages coupon redemption verification
- Handles seasonal promotions autonomously

### 3. **Intelligent Tip Optimization**
- AI suggests optimal tip amounts for engagement
- Handles tip pooling and community challenges
- Automates recurring tips

### 4. **Dynamic Economics Management**
- Adjusts reward rates based on supply/demand
- Creates time-limited bonus campaigns
- Manages token inflation control

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install @coinbase/cdp-agentkit-core @coinbase/cdp-agentkit-langchain @langchain/core @langchain/openai langchain
```

### Step 2: Get CDP API Keys

1. Visit [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project
3. Generate API key pair
4. Save the key name and private key securely

### Step 3: Environment Setup

```bash
# CDP Agent Kit Configuration
CDP_API_KEY_NAME=your_cdp_api_key_name
CDP_API_KEY_PRIVATE_KEY=your_cdp_api_key_private_key

# OpenAI for Agent Kit
OPENAI_API_KEY=your_openai_api_key

# Smart Contract Addresses
BEAN_TOKEN_ADDRESS=0x1234567890123456789012345678901234567890
```

### Step 4: Test Agent Integration

```bash
# Test autonomous validation endpoint
curl -X POST https://stage.agentix.cc/api/agents/validate-snap \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/coffee.jpg",
    "userAddress": "0x742d35Cc6635C0532925a3b8c17C4D1F8E73b6a2",
    "venueName": "Blue Bottle Coffee",
    "city": "Oakland",
    "state": "CA",
    "coffeeType": "Gibraltar",
    "userStreak": 5,
    "isNewVenue": false
  }'
```

## 📋 Implementation Status

### ✅ Completed
- [x] Agent Kit dependency setup
- [x] CoffeeRewardAgent class implementation
- [x] API endpoints for agent operations
- [x] Environment configuration
- [x] Backend route integration

### 🔄 Next Steps
1. **Install npm dependencies**: `npm install` in backend
2. **Configure environment variables**: Set CDP and OpenAI keys
3. **Deploy smart contracts**: Deploy $BEAN token and NFT contracts
4. **Test autonomous validation**: Use test endpoint to validate setup
5. **Frontend integration**: Connect frontend to agent endpoints

## 🔧 Usage Examples

### Autonomous Coffee Validation

```typescript
// Frontend calls agent endpoint instead of manual validation
const response = await fetch('/api/agents/validate-snap', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imageUrl: uploadedImageUrl,
    userAddress: walletAddress,
    venueName,
    city,
    state,
    coffeeType,
    userStreak: currentStreak,
    isNewVenue: !existingVenues.includes(venueName)
  })
});

// Agent automatically:
// 1. Validates photo authenticity using AI vision
// 2. Calculates appropriate reward amount
// 3. Transfers BEAN tokens to user
// 4. Returns detailed validation report
```

### Coffee Shop Setup

```typescript
// Automatically create wallets for new coffee shops
const response = await fetch('/api/agents/setup-coffee-shop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    venueName: "New Local Café",
    city: "San Francisco",
    state: "CA",
    placeId: "ChIJ123abc456def"
  })
});

// Agent automatically:
// 1. Creates CDP wallet for the venue
// 2. Deploys NFT coupon contract
// 3. Sets up loyalty parameters
// 4. Funds wallet for operations
```

### Tip Optimization

```typescript
// Get AI-optimized tip suggestions
const response = await fetch('/api/agents/optimize-tip', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fromUser: userFid,
    toCreator: creatorFid,
    creatorEngagement: 0.85, // engagement score 0-1
    suggestedAmount: 10 // user's proposed tip
  })
});

// Agent considers:
// - Creator's recent activity and engagement
// - Optimal tip amounts for this creator tier
// - User's tipping history and patterns
// - Current market conditions
```

## 🏗️ Architecture Benefits

### Traditional Flow
```
User uploads photo → Manual validation → Manual reward calculation → Manual token transfer
```

### Agent Kit Flow
```
User uploads photo → AI Agent autonomously validates, calculates, and distributes rewards
```

### Key Advantages

1. **Autonomous Operation**: No manual intervention needed
2. **Intelligent Decision Making**: AI considers multiple factors
3. **Consistent Quality**: Standardized validation criteria
4. **Scalable**: Handles high volume without human oversight
5. **Cost Effective**: Reduces operational overhead
6. **Real-time**: Immediate rewards for better UX

## 🔒 Security Considerations

### Best Practices
- CDP Agent Kit handles private key management securely
- Agents operate within defined parameters and limits
- All transactions are auditable on Base blockchain
- Rate limiting prevents abuse
- Input validation ensures data integrity

### Monitoring
- Track agent decision accuracy
- Monitor token distribution patterns
- Alert on unusual activity
- Regular performance reviews

## 📈 Expected Impact

### User Experience
- ⚡ **Faster Rewards**: Immediate token distribution
- 🎯 **Consistent Quality**: Standardized validation
- 💡 **Smart Suggestions**: AI-optimized tip amounts
- 🔄 **Seamless Flow**: No manual approval delays

### Business Operations
- 📉 **Reduced Costs**: Less manual oversight needed
- 📊 **Better Data**: Detailed AI validation reports
- ⚖️ **Fair Distribution**: Consistent reward criteria
- 🚀 **Scalability**: Handle growth without proportional staff increase

## 🎯 Recommended Implementation Order

1. **Start with Autonomous Validation** - Core value proposition
2. **Add Tip Optimization** - Improve user engagement  
3. **Implement Coffee Shop Setup** - Streamline onboarding
4. **Deploy Economic Management** - Advanced tokenomics

## 💡 Future Enhancements

- **Multi-chain Support**: Expand beyond Base network
- **Advanced AI Models**: Upgrade to GPT-5 when available
- **Predictive Analytics**: Forecast user behavior and preferences
- **Community Governance**: AI-assisted DAO decision making
- **Cross-platform Integration**: Social media and other apps

## 📞 Support

- **CDP Documentation**: https://docs.cdp.coinbase.com/agent-kit/
- **Agent Kit GitHub**: https://github.com/coinbase/cdp-agentkit
- **Langchain Integration**: https://docs.cdp.coinbase.com/agent-kit/core-concepts/integrate-langchain-tools
- **Base Network**: https://docs.base.org/