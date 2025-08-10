#!/bin/bash

# Verify Contracts on BaseScan
# Make sure BASESCAN_API_KEY is set in .env file

echo "🔍 Verifying deployed contracts on Base Sepolia..."

# Contract addresses from deployment
BEAN_TOKEN="0xC74C0f76acA119B8e68F7A4f7580E80f0BE42752"
REWARDS_CONTROLLER="0xE3b30Cc77dfbEBC69C3c1e40703C792A934dE834"
ADMIN_ADDRESS="0x10Ab9243E7E5FA1537523395CdD4323b019e3C67"

echo ""
echo "📋 Contract Details:"
echo "   BEAN Token: $BEAN_TOKEN"
echo "   RewardsController: $REWARDS_CONTROLLER"
echo "   Admin: $ADMIN_ADDRESS"
echo ""

# Verify BEAN Token (LoyaltyToken)
echo "🔄 Verifying BEAN Token..."
npx hardhat verify --network base-sepolia \
  "$BEAN_TOKEN" \
  "Snap Coffee BEAN" \
  "BEAN" \
  "$ADMIN_ADDRESS"

echo ""

# Verify RewardsController
echo "🔄 Verifying RewardsController..."
npx hardhat verify --network base-sepolia \
  "$REWARDS_CONTROLLER" \
  "$BEAN_TOKEN" \
  "$ADMIN_ADDRESS"

echo ""
echo "✅ Verification complete!"
echo ""
echo "🔗 View on BaseScan:"
echo "   BEAN Token: https://sepolia.basescan.org/address/$BEAN_TOKEN"
echo "   RewardsController: https://sepolia.basescan.org/address/$REWARDS_CONTROLLER"