import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("🚀 Starting RewardsController deployment...\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  // Load BEAN token address from previous deployment
  const beanDeploymentPath = path.join(__dirname, '../addresses/base-sepolia-84532-bean.json');
  let beanTokenAddress = "";
  
  if (fs.existsSync(beanDeploymentPath)) {
    const beanDeployment = JSON.parse(fs.readFileSync(beanDeploymentPath, 'utf8'));
    beanTokenAddress = beanDeployment.tokenAddress;
    console.log(`📄 Found BEAN Token: ${beanTokenAddress}`);
  } else {
    console.error("❌ BEAN token deployment not found. Please deploy BEAN token first.");
    process.exit(1);
  }

  // Configuration
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || deployer.address;

  console.log("📋 RewardsController Configuration:");
  console.log(`   BEAN Token: ${beanTokenAddress}`);
  console.log(`   Admin: ${ADMIN_ADDRESS}`);
  console.log(`   Coffee Reward: 3 BEAN tokens`);
  console.log(`   Daily Limit: 10 coffees per user`);
  console.log(`   Cooldown: 30 minutes per location\n`);

  try {
    // Deploy RewardsController
    console.log("🔄 Deploying RewardsController...");
    const RewardsControllerFactory = await ethers.getContractFactory("RewardsController");
    const rewardsController = await RewardsControllerFactory.deploy(
      beanTokenAddress,
      ADMIN_ADDRESS
    );
    
    console.log("⏳ Waiting for deployment confirmation...");
    await rewardsController.waitForDeployment();
    
    const controllerAddress = await rewardsController.getAddress();
    const deploymentTx = rewardsController.deploymentTransaction();
    
    console.log("🎉 RewardsController deployed successfully!\n");
    console.log("📋 Deployment Details:");
    console.log(`   Contract Address: ${controllerAddress}`);
    console.log(`   Transaction Hash: ${deploymentTx?.hash || 'N/A'}`);
    console.log(`   Network: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Deployer: ${deployer.address}\n`);
    
    // Wait a bit for contract indexing
    console.log("⏳ Waiting for contract to be indexed...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify contract info with error handling
    let contractInfo;
    try {
      const stats = await rewardsController.getContractStats();
      const beanAddress = await rewardsController.beanToken();
      
      contractInfo = {
        beanTokenAddress: beanAddress,
        totalRewards: stats.totalRewards.toString(),
        totalCoffees: stats.totalCoffees.toString(),
        activeMerchants: stats.activeMerchants.toString()
      };
      
      console.log("✅ Contract Information:");
      console.log(`   BEAN Token: ${beanAddress}`);
      console.log(`   Total Rewards Distributed: ${stats.totalRewards} BEAN`);
      console.log(`   Total Coffees Verified: ${stats.totalCoffees}`);
      console.log(`   Active Merchants: ${stats.activeMerchants}\n`);
      
    } catch (error) {
      console.log("⚠️ Could not fetch contract info immediately (this is normal on testnets)");
      contractInfo = {
        beanTokenAddress: beanTokenAddress,
        totalRewards: "0",
        totalCoffees: "0",
        activeMerchants: "0"
      };
    }

    // Now we need to grant MINTER_ROLE to RewardsController on BEAN token
    console.log("🔄 Granting MINTER_ROLE to RewardsController on BEAN token...");
    try {
      const beanToken = await ethers.getContractAt("LoyaltyToken", beanTokenAddress);
      const minterRole = await beanToken.MINTER_ROLE();
      
      // Check if RewardsController already has MINTER_ROLE
      const hasMinterRole = await beanToken.hasRole(minterRole, controllerAddress);
      
      if (!hasMinterRole) {
        const grantTx = await beanToken.grantRole(minterRole, controllerAddress);
        await grantTx.wait();
        console.log("✅ MINTER_ROLE granted to RewardsController");
        console.log(`   Transaction: ${grantTx.hash}`);
      } else {
        console.log("✅ RewardsController already has MINTER_ROLE");
      }
    } catch (error) {
      console.error("⚠️ Could not grant MINTER_ROLE:", error);
      console.log("❗ Manual action required: Grant MINTER_ROLE to RewardsController");
    }

    // Save deployment information
    const deploymentInfo = {
      controllerAddress: controllerAddress,
      beanTokenAddress: beanTokenAddress,
      transactionHash: deploymentTx?.hash || 'N/A',
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      admin: ADMIN_ADDRESS,
      deployedAt: new Date().toISOString(),
      contractInfo: contractInfo,
      config: {
        coffeeRewardAmount: "3000000000000000000", // 3 BEAN in wei
        dailyClaimLimit: "10",
        cooldownPeriod: "1800" // 30 minutes in seconds
      }
    };

    // Create addresses directory
    const addressesDir = path.join(__dirname, '../addresses');
    if (!fs.existsSync(addressesDir)) {
      fs.mkdirSync(addressesDir, { recursive: true });
    }
    
    const addressesFile = path.join(addressesDir, `${network.name}-${network.chainId}-rewards.json`);
    fs.writeFileSync(addressesFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${addressesFile}\n`);

    // Update Backend .env file
    const backendEnvPath = path.join(__dirname, '../../Backend/.env');
    if (fs.existsSync(backendEnvPath)) {
      let envContent = fs.readFileSync(backendEnvPath, 'utf8');
      
      // Add REWARDS_CONTROLLER_ADDRESS
      if (envContent.includes('REWARDS_CONTROLLER_ADDRESS=')) {
        envContent = envContent.replace(/REWARDS_CONTROLLER_ADDRESS=.*/, `REWARDS_CONTROLLER_ADDRESS=${controllerAddress}`);
      } else {
        envContent += `\nREWARDS_CONTROLLER_ADDRESS=${controllerAddress}`;
      }
      
      fs.writeFileSync(backendEnvPath, envContent);
      console.log(`🔧 Updated Backend/.env with controller address\n`);
    }

    // Display next steps
    console.log("🔗 Links:");
    if (network.chainId === 84532n) {
      console.log(`   BaseScan (Sepolia): https://sepolia.basescan.org/address/${controllerAddress}`);
      console.log(`   Transaction: https://sepolia.basescan.org/tx/${deploymentTx?.hash}`);
    }
    
    console.log("\n📝 Next Steps:");
    console.log("   1. ✅ RewardsController deployed successfully");
    console.log("   2. ✅ Backend/.env updated with controller address");
    console.log("   3. Register merchants using registerMerchant()");
    console.log("   4. Test coffee verification through backend API");
    console.log("   5. Verify contract on BaseScan:");
    console.log(`      npx hardhat verify --network base-sepolia ${controllerAddress} "${beanTokenAddress}" "${ADMIN_ADDRESS}"`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ RewardsController deployment completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });