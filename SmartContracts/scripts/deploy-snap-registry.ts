import { ethers } from "hardhat";
import { SnapRegistry } from "../typechain-types";
import * as fs from "fs";
import * as path from "path";

/**
 * Deploy SnapRegistry contract to Base Sepolia
 * 
 * SnapRegistry is the core event logging and analytics system for Snap Coffee.
 * It tracks coffee snaps, user statistics, venue analytics, and milestone progress.
 * 
 * Features:
 * - Event logging for coffee snaps, rewards, and redemptions
 * - User statistics and milestone tracking
 * - Venue analytics for coffee shop insights
 * - Anti-fraud protection with duplicate detection and rate limiting
 * - Role-based access control for secure operations
 */

async function main() {
  console.log("🚀 Starting SnapRegistry deployment...\n");

  // Get deployment configuration
  const adminAddress = process.env.ADMIN_ADDRESS;
  
  if (!adminAddress) {
    throw new Error("❌ ADMIN_ADDRESS not found in environment variables");
  }

  console.log("📋 Deployment Configuration:");
  console.log(`   Admin Address: ${adminAddress}`);
  console.log(`   Network: Base Sepolia (Chain ID: 84532)`);
  console.log("");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);
  
  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.001")) {
    console.warn("⚠️  Warning: Low balance. Ensure sufficient ETH for deployment and verification.");
  }
  console.log("");

  // Deploy SnapRegistry contract
  console.log("🏗️  Deploying SnapRegistry contract...");
  const SnapRegistryFactory = await ethers.getContractFactory("SnapRegistry");
  
  // Deploy with admin address as constructor parameter
  const snapRegistry = await SnapRegistryFactory.deploy(adminAddress) as SnapRegistry;
  
  console.log("⏳ Waiting for deployment transaction...");
  await snapRegistry.waitForDeployment();
  
  const contractAddress = await snapRegistry.getAddress();
  const deploymentTx = snapRegistry.deploymentTransaction();
  
  console.log("✅ SnapRegistry deployed successfully!");
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔗 Transaction Hash: ${deploymentTx?.hash}`);
  console.log(`⛽ Gas Used: ${deploymentTx?.gasLimit?.toString()}`);
  console.log("");

  // Verify contract roles
  console.log("🔐 Verifying contract roles...");
  try {
    const DEFAULT_ADMIN_ROLE = await snapRegistry.DEFAULT_ADMIN_ROLE();
    const RECORDER_ROLE = await snapRegistry.RECORDER_ROLE();
    const PAUSER_ROLE = await snapRegistry.PAUSER_ROLE();
    const ANALYTICS_ROLE = await snapRegistry.ANALYTICS_ROLE();
    
    const hasAdminRole = await snapRegistry.hasRole(DEFAULT_ADMIN_ROLE, adminAddress);
    const hasPauserRole = await snapRegistry.hasRole(PAUSER_ROLE, adminAddress);
    const hasAnalyticsRole = await snapRegistry.hasRole(ANALYTICS_ROLE, adminAddress);
    
    console.log(`   Admin Role: ${hasAdminRole ? '✅' : '❌'} (${adminAddress})`);
    console.log(`   Pauser Role: ${hasPauserRole ? '✅' : '❌'} (${adminAddress})`);
    console.log(`   Analytics Role: ${hasAnalyticsRole ? '✅' : '❌'} (${adminAddress})`);
    console.log(`   Recorder Role: Available for assignment to CDP Agents`);
  } catch (error) {
    console.warn("⚠️  Could not verify roles:", error);
  }
  console.log("");

  // Check contract constants
  console.log("📊 Contract Configuration:");
  try {
    const snapCooldown = await snapRegistry.SNAP_COOLDOWN();
    const dailySnapLimit = await snapRegistry.DAILY_SNAP_LIMIT();
    const fraudThreshold = await snapRegistry.FRAUD_THRESHOLD();
    
    console.log(`   Snap Cooldown: ${snapCooldown.toString()} seconds (${Number(snapCooldown) / 3600} hours)`);
    console.log(`   Daily Snap Limit: ${dailySnapLimit.toString()} snaps per day`);
    console.log(`   Fraud Threshold: ${fraudThreshold.toString()} reports before blacklist`);
  } catch (error) {
    console.warn("⚠️  Could not read contract constants:", error);
  }
  console.log("");

  // Save deployment information
  const deploymentInfo = {
    network: "base-sepolia",
    chainId: 84532,
    contractName: "SnapRegistry",
    contractAddress: contractAddress,
    deploymentTransaction: deploymentTx?.hash,
    deploymentTimestamp: new Date().toISOString(),
    deployerAddress: deployer.address,
    adminAddress: adminAddress,
    gasUsed: deploymentTx?.gasLimit?.toString(),
    constructorArgs: [adminAddress],
    roles: {
      DEFAULT_ADMIN_ROLE: adminAddress,
      PAUSER_ROLE: adminAddress,
      ANALYTICS_ROLE: adminAddress,
      RECORDER_ROLE: "Available for assignment"
    },
    configuration: {
      snapCooldown: "3600 seconds (1 hour)",
      dailySnapLimit: "10 snaps per day",
      fraudThreshold: "3 reports before blacklist"
    }
  };

  // Create addresses directory if it doesn't exist
  const addressesDir = path.join(__dirname, "..", "addresses");
  if (!fs.existsSync(addressesDir)) {
    fs.mkdirSync(addressesDir, { recursive: true });
  }

  // Save to addresses directory
  const filename = `base-sepolia-84532-snap-registry.json`;
  const filepath = path.join(addressesDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: addresses/${filename}`);

  // Verification instructions
  console.log("");
  console.log("🔍 Next Steps - Contract Verification:");
  console.log("Run the following command to verify the contract on BaseScan:");
  console.log("");
  console.log(`npx hardhat verify --network base-sepolia ${contractAddress} "${adminAddress}"`);
  console.log("");
  
  console.log("📝 Environment Variables to Update:");
  console.log(`SNAP_REGISTRY_ADDRESS=${contractAddress}`);
  console.log(`SNAP_REGISTRY_TX_HASH=${deploymentTx?.hash}`);
  console.log("");

  console.log("🎯 Integration Steps:");
  console.log("1. Update environment files with new contract address");
  console.log("2. Grant RECORDER_ROLE to CDP Agent Kit wallet");
  console.log("3. Update backend services to use SnapRegistry for event logging");
  console.log("4. Test coffee snap recording and analytics functions");
  console.log("");

  console.log("✅ SnapRegistry deployment completed successfully!");
  
  return {
    contractAddress,
    deploymentTx: deploymentTx?.hash
  };
}

// Execute deployment
main()
  .then((result) => {
    console.log("🚀 Deployment script completed successfully!");
    console.log(`📍 Contract deployed at: ${result.contractAddress}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });