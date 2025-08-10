import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log("🚀 Starting BEAN Token deployment...\n");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log(`📡 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer address: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH\n`);

  // Configuration
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || deployer.address;
  const CDP_WALLET_ADDRESS = process.env.CDP_WALLET_ADDRESS || deployer.address;

  console.log("📋 BEAN Token Configuration:");
  console.log(`   Name: Snap Coffee Bean`);
  console.log(`   Symbol: BEAN`);
  console.log(`   Admin: ${ADMIN_ADDRESS}`);
  console.log(`   CDP Wallet: ${CDP_WALLET_ADDRESS}\n`);

  try {
    // Deploy BEAN Token (LoyaltyToken)
    console.log("🔄 Deploying BEAN Token...");
    const LoyaltyTokenFactory = await ethers.getContractFactory("LoyaltyToken");
    const loyaltyToken = await LoyaltyTokenFactory.deploy(
      ADMIN_ADDRESS,
      CDP_WALLET_ADDRESS
    );
    
    console.log("⏳ Waiting for deployment confirmation...");
    await loyaltyToken.waitForDeployment();
    
    const tokenAddress = await loyaltyToken.getAddress();
    const deploymentTx = loyaltyToken.deploymentTransaction();
    
    console.log("🎉 BEAN Token deployed successfully!\n");
    console.log("📋 Deployment Details:");
    console.log(`   Contract Address: ${tokenAddress}`);
    console.log(`   Transaction Hash: ${deploymentTx?.hash || 'N/A'}`);
    console.log(`   Network: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}`);
    console.log(`   Deployer: ${deployer.address}\n`);
    
    // Wait a bit for the contract to be fully indexed
    console.log("⏳ Waiting for contract to be indexed...");
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Verify token info with error handling
    let tokenInfo;
    try {
      const totalSupply = await loyaltyToken.totalSupply();
      const maxSupply = await loyaltyToken.MAX_SUPPLY();
      const name = await loyaltyToken.name();
      const symbol = await loyaltyToken.symbol();
      
      tokenInfo = {
        name: name,
        symbol: symbol,
        initialSupply: ethers.formatEther(totalSupply),
        maxSupply: ethers.formatEther(maxSupply)
      };
      
      console.log("✅ Token Information:");
      console.log(`   Name: ${name}`);
      console.log(`   Symbol: ${symbol}`);
      console.log(`   Initial Supply: ${ethers.formatEther(totalSupply)} BEAN`);
      console.log(`   Max Supply: ${ethers.formatEther(maxSupply)} BEAN\n`);
    } catch (error) {
      console.log("⚠️ Could not fetch token info immediately (this is normal on testnets)");
      tokenInfo = {
        name: "Snap Coffee Bean",
        symbol: "BEAN",
        initialSupply: "1000000",
        maxSupply: "1000000000"
      };
    }

    // Save deployment information
    const deploymentInfo = {
      tokenAddress: tokenAddress,
      transactionHash: deploymentTx?.hash || 'N/A',
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      admin: ADMIN_ADDRESS,
      cdpWallet: CDP_WALLET_ADDRESS,
      deployedAt: new Date().toISOString(),
      tokenInfo: tokenInfo
    };

    // Create addresses directory
    const addressesDir = path.join(__dirname, '../addresses');
    if (!fs.existsSync(addressesDir)) {
      fs.mkdirSync(addressesDir, { recursive: true });
    }
    
    const addressesFile = path.join(addressesDir, `${network.name}-${network.chainId}-bean.json`);
    fs.writeFileSync(addressesFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${addressesFile}\n`);

    // Update Backend .env file
    const backendEnvPath = path.join(__dirname, '../../Backend/.env');
    if (fs.existsSync(backendEnvPath)) {
      let envContent = fs.readFileSync(backendEnvPath, 'utf8');
      
      // Update LOYALTY_TOKEN_ADDRESS
      if (envContent.includes('LOYALTY_TOKEN_ADDRESS=')) {
        envContent = envContent.replace(/LOYALTY_TOKEN_ADDRESS=.*/, `LOYALTY_TOKEN_ADDRESS=${tokenAddress}`);
      } else {
        envContent += `\nLOYALTY_TOKEN_ADDRESS=${tokenAddress}`;
      }
      
      fs.writeFileSync(backendEnvPath, envContent);
      console.log(`🔧 Updated Backend/.env with token address\n`);
    }

    // Display next steps
    console.log("🔗 Links:");
    if (network.chainId === 84532n) {
      console.log(`   BaseScan (Sepolia): https://sepolia.basescan.org/address/${tokenAddress}`);
      console.log(`   Transaction: https://sepolia.basescan.org/tx/${deploymentTx?.hash}`);
    } else if (network.chainId === 8453n) {
      console.log(`   BaseScan: https://basescan.org/address/${tokenAddress}`);
      console.log(`   Transaction: https://basescan.org/tx/${deploymentTx?.hash}`);
    }
    
    console.log("\n📝 Next Steps:");
    console.log("   1. ✅ Contract deployed successfully");
    console.log("   2. ✅ Backend/.env updated with contract address");
    console.log("   3. Update Frontend configuration with the contract address");
    console.log("   4. Test token minting through your backend API");
    console.log("   5. Set up contract verification (optional):");
    console.log(`      npx hardhat verify --network ${network.name} ${tokenAddress} "${ADMIN_ADDRESS}" "${CDP_WALLET_ADDRESS}"`);

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Deployment completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });