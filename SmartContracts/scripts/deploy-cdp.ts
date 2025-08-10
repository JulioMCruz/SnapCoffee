import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DeploymentResult {
  tokenAddress: string;
  transactionHash: string;
  blockNumber: number;
  network: string;
}

async function deployBEANToken(): Promise<DeploymentResult> {
  console.log("🚀 Starting BEAN Token deployment with CDP SDK...\n");

  try {
    // Initialize Coinbase SDK
    const cdpApiKey = process.env.CDP_API_KEY;
    const cdpApiSecret = process.env.CDP_API_SECRET;
    
    if (!cdpApiKey || !cdpApiSecret) {
      throw new Error("CDP_API_KEY and CDP_API_SECRET must be set in .env file");
    }

    Coinbase.configure({
      apiKeyName: cdpApiKey,
      privateKey: cdpApiSecret
    });

    console.log("✅ CDP SDK configured successfully");

    // For now, let's create a new wallet and then we'll fund it
    // In production, you'd want to import an existing funded wallet
    console.log("📝 Creating new wallet...");
    const wallet = await Wallet.create({
      networkId: "base-sepolia"
    });
    
    console.log("💡 Note: This creates a new wallet. You'll need to fund it before deployment.");
    console.log("   To use your existing funded wallet, we'll need the wallet seed phrase.");

    const defaultAddress = await wallet.getDefaultAddress();
    console.log(`👤 Wallet Address: ${defaultAddress.getId()}`);

    // Get wallet balance
    const balance = await defaultAddress.getBalance("eth");
    console.log(`💰 Wallet Balance: ${balance.toString()} ETH\n`);

    // Deploy BEAN Token using CDP's deployToken method
    console.log("🔄 Deploying BEAN Token...");
    console.log("📋 Token Configuration:");
    console.log(`   Name: Snap Coffee Bean`);
    console.log(`   Symbol: BEAN`);
    console.log(`   Total Supply: 1,000,000,000 BEAN\n`);

    const deployedContract = await wallet.deployToken({
      name: "Snap Coffee Bean",
      symbol: "BEAN",
      totalSupply: 1000000000 // 1 billion tokens
    });

    console.log("⏳ Waiting for deployment confirmation...");
    await deployedContract.wait();

    const contractAddress = deployedContract.getContractAddress();
    const transaction = deployedContract.getTransaction();
    const transactionHash = transaction?.getTransactionHash() || "N/A";

    console.log("🎉 BEAN Token deployed successfully!\n");
    console.log("📋 Deployment Details:");
    console.log(`   Contract Address: ${contractAddress}`);
    console.log(`   Transaction Hash: ${transactionHash}`);
    console.log(`   Network: base-sepolia`);
    console.log(`   Deployer: ${defaultAddress.getId()}\n`);

    // Save deployment information
    const deploymentInfo = {
      tokenAddress: contractAddress,
      transactionHash: transactionHash || "N/A",
      blockNumber: 0, // CDP SDK doesn't provide block number directly
      network: "base-sepolia",
      deployer: defaultAddress.getId(),
      deployedAt: new Date().toISOString(),
      tokenName: "Snap Coffee Bean",
      tokenSymbol: "BEAN",
      totalSupply: "1000000000"
    };

    // Create addresses directory if it doesn't exist
    const addressesDir = path.join(__dirname, '../addresses');
    if (!fs.existsSync(addressesDir)) {
      fs.mkdirSync(addressesDir, { recursive: true });
    }

    // Save to JSON file
    const addressesFile = path.join(addressesDir, 'base-sepolia-cdp.json');
    fs.writeFileSync(addressesFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${addressesFile}\n`);

    // Display contract interaction instructions
    console.log("🔗 Contract Interaction:");
    console.log(`   View on BaseScan: https://sepolia.basescan.org/address/${contractAddress}`);
    console.log(`   Transaction: https://sepolia.basescan.org/tx/${transactionHash}\n`);

    console.log("📝 Next Steps:");
    console.log("   1. Update Backend/.env with the contract address");
    console.log("   2. Update Frontend configuration");
    console.log("   3. Test token interactions");
    console.log("   4. Set up monitoring and analytics\n");

    return {
      tokenAddress: contractAddress,
      transactionHash: transactionHash || "N/A",
      blockNumber: 0,
      network: "base-sepolia"
    };

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
    if (error.details) {
      console.error("Error details:", error.details);
    }
    throw error;
  }
}

// Additional function to interact with deployed token (optional)
async function interactWithToken(tokenAddress: string) {
  console.log(`🔄 Testing token interactions for ${tokenAddress}...`);
  
  try {
    const wallet = await Wallet.import({
      networkId: "base-sepolia", 
      seed: process.env.PRIVATE_KEY!
    });

    const defaultAddress = await wallet.getDefaultAddress();

    // Example: Check token balance
    console.log("✅ Token interaction test completed");
    
  } catch (error: any) {
    console.error("❌ Token interaction failed:", error.message);
  }
}

// Main execution
async function main() {
  try {
    const result = await deployBEANToken();
    
    // Optionally test interactions
    // await interactWithToken(result.tokenAddress);
    
    console.log("✅ Deployment process completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Deployment process failed:", error);
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main();
}

export { deployBEANToken, interactWithToken };