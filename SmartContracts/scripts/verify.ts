import { run, network } from "hardhat";
import fs from "fs";
import path from "path";

interface DeploymentAddresses {
  loyaltyToken: string;
  couponNFT: string;
  snapRegistry: string;
  admin: string;
  cdpWallet: string;
}

async function main() {
  console.log("🔍 Starting contract verification...\n");

  // Get network info
  const networkInfo = await network.provider.send("eth_chainId", []);
  const chainId = parseInt(networkInfo, 16);
  console.log(`📡 Network: ${network.name} (Chain ID: ${chainId})`);

  // Check if network supports verification
  if (chainId !== 84532 && chainId !== 8453) {
    console.log("⚠️  This network doesn't support Etherscan verification");
    process.exit(0);
  }

  // Load deployment addresses
  const addressesFile = path.join(__dirname, `../addresses/${network.name}-${chainId}.json`);
  
  if (!fs.existsSync(addressesFile)) {
    console.error(`❌ Addresses file not found: ${addressesFile}`);
    console.error("Please run deployment first or check the file path");
    process.exit(1);
  }

  const addresses: DeploymentAddresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
  console.log("📋 Loaded deployment addresses:");
  console.log(`   LoyaltyToken: ${addresses.loyaltyToken}`);
  console.log(`   CouponNFT: ${addresses.couponNFT}`);
  console.log(`   SnapRegistry: ${addresses.snapRegistry}\n`);

  // Configuration (should match deployment)
  const ADMIN_ADDRESS = addresses.admin;
  const CDP_WALLET_ADDRESS = addresses.cdpWallet;
  const BASE_URI = process.env.NFT_BASE_URI || "https://snapcoffee.xyz/api/metadata/";

  try {
    // 1. Verify LoyaltyToken
    console.log("1️⃣ Verifying LoyaltyToken...");
    try {
      await run("verify:verify", {
        address: addresses.loyaltyToken,
        constructorArguments: [ADMIN_ADDRESS, CDP_WALLET_ADDRESS],
        contract: "contracts/LoyaltyToken.sol:LoyaltyToken"
      });
      console.log("✅ LoyaltyToken verified successfully");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ LoyaltyToken already verified");
      } else {
        console.error("❌ LoyaltyToken verification failed:", error.message);
      }
    }

    // 2. Verify CouponNFT  
    console.log("\n2️⃣ Verifying CouponNFT...");
    try {
      await run("verify:verify", {
        address: addresses.couponNFT,
        constructorArguments: [ADMIN_ADDRESS, CDP_WALLET_ADDRESS, BASE_URI],
        contract: "contracts/CouponNFT.sol:CouponNFT"
      });
      console.log("✅ CouponNFT verified successfully");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ CouponNFT already verified");
      } else {
        console.error("❌ CouponNFT verification failed:", error.message);
      }
    }

    // 3. Verify SnapRegistry
    console.log("\n3️⃣ Verifying SnapRegistry...");
    try {
      await run("verify:verify", {
        address: addresses.snapRegistry,
        constructorArguments: [ADMIN_ADDRESS],
        contract: "contracts/SnapRegistry.sol:SnapRegistry"
      });
      console.log("✅ SnapRegistry verified successfully");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ SnapRegistry already verified");
      } else {
        console.error("❌ SnapRegistry verification failed:", error.message);
      }
    }

    console.log("\n🎉 Contract verification completed!");
    
    // Display explorer links
    const baseUrl = chainId === 84532 
      ? "https://sepolia.basescan.org" 
      : "https://basescan.org";
    
    console.log("\n🔗 View contracts on BaseScan:");
    console.log(`   LoyaltyToken: ${baseUrl}/address/${addresses.loyaltyToken}`);
    console.log(`   CouponNFT: ${baseUrl}/address/${addresses.couponNFT}`);
    console.log(`   SnapRegistry: ${baseUrl}/address/${addresses.snapRegistry}\n`);

  } catch (error) {
    console.error("❌ Verification process failed:", error);
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("✅ Verification script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Verification script failed:", error);
    process.exit(1);
  });