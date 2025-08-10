import { ethers } from "hardhat";
import { LoyaltyToken, CouponNFT, SnapRegistry } from "../typechain-types";

interface DeploymentAddresses {
  loyaltyToken: string;
  couponNFT: string;
  snapRegistry: string;
  admin: string;
  cdpWallet: string;
}

async function main() {
  console.log("🚀 Starting Snap Coffee smart contract deployment...\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  // Configuration
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || deployer.address;
  const CDP_WALLET_ADDRESS = process.env.CDP_WALLET_ADDRESS || deployer.address;
  const BASE_URI = process.env.NFT_BASE_URI || "https://snapcoffee.xyz/api/metadata/";

  console.log("📋 Configuration:");
  console.log(`   Admin: ${ADMIN_ADDRESS}`);
  console.log(`   CDP Wallet: ${CDP_WALLET_ADDRESS}`);
  console.log(`   NFT Base URI: ${BASE_URI}\n`);

  const deploymentAddresses: DeploymentAddresses = {
    loyaltyToken: "",
    couponNFT: "",
    snapRegistry: "",
    admin: ADMIN_ADDRESS,
    cdpWallet: CDP_WALLET_ADDRESS
  };

  try {
    // 1. Deploy LoyaltyToken ($BEAN)
    console.log("1️⃣ Deploying LoyaltyToken ($BEAN)...");
    const LoyaltyTokenFactory = await ethers.getContractFactory("LoyaltyToken");
    const loyaltyToken = await LoyaltyTokenFactory.deploy(
      ADMIN_ADDRESS,
      CDP_WALLET_ADDRESS
    );
    await loyaltyToken.waitForDeployment();
    const loyaltyTokenAddress = await loyaltyToken.getAddress();
    deploymentAddresses.loyaltyToken = loyaltyTokenAddress;
    
    console.log(`✅ LoyaltyToken deployed to: ${loyaltyTokenAddress}`);
    
    // Verify initial supply
    const totalSupply = await loyaltyToken.totalSupply();
    const maxSupply = await loyaltyToken.MAX_SUPPLY();
    console.log(`   Initial supply: ${ethers.formatEther(totalSupply)} BEAN`);
    console.log(`   Max supply: ${ethers.formatEther(maxSupply)} BEAN\n`);

    // 2. Deploy CouponNFT
    console.log("2️⃣ Deploying CouponNFT...");
    const CouponNFTFactory = await ethers.getContractFactory("CouponNFT");
    const couponNFT = await CouponNFTFactory.deploy(
      ADMIN_ADDRESS,
      CDP_WALLET_ADDRESS,
      BASE_URI
    );
    await couponNFT.waitForDeployment();
    const couponNFTAddress = await couponNFT.getAddress();
    deploymentAddresses.couponNFT = couponNFTAddress;
    
    console.log(`✅ CouponNFT deployed to: ${couponNFTAddress}`);
    
    // Verify NFT config
    const nftInfo = await couponNFT.getContractInfo();
    console.log(`   Name: ${nftInfo.name_}`);
    console.log(`   Symbol: ${nftInfo.symbol_}`);
    console.log(`   Max Supply: ${nftInfo.maxSupply_}\n`);

    // 3. Deploy SnapRegistry
    console.log("3️⃣ Deploying SnapRegistry...");
    const SnapRegistryFactory = await ethers.getContractFactory("SnapRegistry");
    const snapRegistry = await SnapRegistryFactory.deploy(ADMIN_ADDRESS);
    await snapRegistry.waitForDeployment();
    const snapRegistryAddress = await snapRegistry.getAddress();
    deploymentAddresses.snapRegistry = snapRegistryAddress;
    
    console.log(`✅ SnapRegistry deployed to: ${snapRegistryAddress}`);
    
    // Verify registry config
    const currentSnapId = await snapRegistry.getCurrentSnapId();
    console.log(`   Current Snap ID: ${currentSnapId}\n`);

    // 4. Setup roles and permissions
    console.log("4️⃣ Setting up roles and permissions...");
    
    // Grant SnapRegistry the RECORDER_ROLE to itself (for internal operations)
    // Grant CDP wallet MINTER_ROLE on CouponNFT (for NFT minting)
    // These are already set in constructors, but we can verify them
    
    const loyaltyMinterRole = await loyaltyToken.MINTER_ROLE();
    const isCDPMinter = await loyaltyToken.hasRole(loyaltyMinterRole, CDP_WALLET_ADDRESS);
    console.log(`   CDP Wallet has MINTER_ROLE on LoyaltyToken: ${isCDPMinter}`);
    
    const couponMinterRole = await couponNFT.MINTER_ROLE();
    const isCDPNFTMinter = await couponNFT.hasRole(couponMinterRole, CDP_WALLET_ADDRESS);
    console.log(`   CDP Wallet has MINTER_ROLE on CouponNFT: ${isCDPNFTMinter}`);
    
    const registryRecorderRole = await snapRegistry.RECORDER_ROLE();
    const isAdminRecorder = await snapRegistry.hasRole(registryRecorderRole, ADMIN_ADDRESS);
    console.log(`   Admin has RECORDER_ROLE on SnapRegistry: ${isAdminRecorder}\n`);

    // 5. Display deployment summary
    console.log("🎉 Deployment completed successfully!\n");
    console.log("📋 Contract Addresses:");
    console.log(`   LoyaltyToken ($BEAN): ${deploymentAddresses.loyaltyToken}`);
    console.log(`   CouponNFT:           ${deploymentAddresses.couponNFT}`);
    console.log(`   SnapRegistry:        ${deploymentAddresses.snapRegistry}\n`);
    
    console.log("🔧 Configuration:");
    console.log(`   Admin Address:       ${deploymentAddresses.admin}`);
    console.log(`   CDP Wallet Address:  ${deploymentAddresses.cdpWallet}\n`);

    // 6. Save addresses to JSON file
    const fs = require('fs');
    const path = require('path');
    const addressesDir = path.join(__dirname, '../addresses');
    if (!fs.existsSync(addressesDir)) {
      fs.mkdirSync(addressesDir, { recursive: true });
    }
    
    const addressesFile = path.join(addressesDir, `${network.name}-${network.chainId}.json`);
    fs.writeFileSync(addressesFile, JSON.stringify(deploymentAddresses, null, 2));
    console.log(`💾 Contract addresses saved to: ${addressesFile}\n`);

    // 7. Verification instructions
    if (network.chainId === 84532n || network.chainId === 8453n) { // Base Sepolia or Base Mainnet
      console.log("🔍 To verify contracts, run:");
      console.log(`npx hardhat verify --network ${network.name} ${deploymentAddresses.loyaltyToken} "${ADMIN_ADDRESS}" "${CDP_WALLET_ADDRESS}"`);
      console.log(`npx hardhat verify --network ${network.name} ${deploymentAddresses.couponNFT} "${ADMIN_ADDRESS}" "${CDP_WALLET_ADDRESS}" "${BASE_URI}"`);
      console.log(`npx hardhat verify --network ${network.name} ${deploymentAddresses.snapRegistry} "${ADMIN_ADDRESS}"`);
      console.log("\nOr run: npm run verify:<network-name>\n");
    }

    // 8. Next steps
    console.log("📝 Next steps:");
    console.log("   1. Update your backend CDP wallet configuration with these addresses");
    console.log("   2. Configure your frontend to use these contract addresses");
    console.log("   3. Set up monitoring and alerts for the deployed contracts");
    console.log("   4. Test the integration on testnet before mainnet usage");
    console.log("   5. Consider setting up a multisig for admin operations on mainnet\n");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("✅ Deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });