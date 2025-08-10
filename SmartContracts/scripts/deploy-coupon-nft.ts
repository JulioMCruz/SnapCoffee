import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface CouponDeploymentResult {
  contractAddress: string;
  transactionHash: string;
  network: string;
  chainId: number;
  deployer: string;
  admin: string;
  cdpWallet: string;
  deployedAt: string;
  contractInfo: {
    name: string;
    symbol: string;
    maxSupply: string;
    baseURI: string;
  };
}

async function main() {
  console.log("🎫 Starting CouponNFT deployment...\n");

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
  const NFT_BASE_URI = process.env.NFT_BASE_URI || "https://snapcoffee.xyz/api/nft/metadata/";

  console.log("📋 Configuration:");
  console.log(`   Admin: ${ADMIN_ADDRESS}`);
  console.log(`   CDP Wallet: ${CDP_WALLET_ADDRESS}`);
  console.log(`   NFT Base URI: ${NFT_BASE_URI}\n`);

  try {
    // Deploy CouponNFT
    console.log("🎫 Deploying CouponNFT contract...");
    const CouponNFTFactory = await ethers.getContractFactory("CouponNFT");
    const couponNFT = await CouponNFTFactory.deploy(
      ADMIN_ADDRESS,
      CDP_WALLET_ADDRESS,
      NFT_BASE_URI
    );
    
    console.log("⏳ Waiting for deployment transaction to be mined...");
    const deploymentReceipt = await couponNFT.deploymentTransaction()?.wait();
    
    if (!deploymentReceipt) {
      throw new Error("Deployment transaction failed");
    }

    const couponNFTAddress = await couponNFT.getAddress();
    console.log(`✅ CouponNFT deployed to: ${couponNFTAddress}`);
    console.log(`🔗 Transaction hash: ${deploymentReceipt.hash}\n`);

    // Verify contract deployment
    console.log("🔍 Verifying contract deployment...");
    const contractInfo = await couponNFT.getContractInfo();
    console.log(`   Name: ${contractInfo.name_}`);
    console.log(`   Symbol: ${contractInfo.symbol_}`);
    console.log(`   Max Supply: ${contractInfo.maxSupply_.toString()}`);
    console.log(`   Base URI: ${contractInfo.baseURI_}`);
    console.log(`   Is Paused: ${contractInfo.isPaused_}`);

    // Verify roles
    console.log("\n🔐 Verifying roles...");
    const minterRole = await couponNFT.MINTER_ROLE();
    const redeemerRole = await couponNFT.REDEEMER_ROLE();
    const pauserRole = await couponNFT.PAUSER_ROLE();
    
    const isCDPMinter = await couponNFT.hasRole(minterRole, CDP_WALLET_ADDRESS);
    const isAdminRedeemer = await couponNFT.hasRole(redeemerRole, ADMIN_ADDRESS);
    const isAdminPauser = await couponNFT.hasRole(pauserRole, ADMIN_ADDRESS);
    
    console.log(`   CDP Wallet has MINTER_ROLE: ${isCDPMinter}`);
    console.log(`   Admin has REDEEMER_ROLE: ${isAdminRedeemer}`);
    console.log(`   Admin has PAUSER_ROLE: ${isAdminPauser}`);

    // Prepare deployment result
    const deploymentResult: CouponDeploymentResult = {
      contractAddress: couponNFTAddress,
      transactionHash: deploymentReceipt.hash,
      network: network.name,
      chainId: Number(network.chainId),
      deployer: deployer.address,
      admin: ADMIN_ADDRESS,
      cdpWallet: CDP_WALLET_ADDRESS,
      deployedAt: new Date().toISOString(),
      contractInfo: {
        name: contractInfo.name_,
        symbol: contractInfo.symbol_,
        maxSupply: contractInfo.maxSupply_.toString(),
        baseURI: contractInfo.baseURI_
      }
    };

    // Save deployment addresses
    const addressesDir = path.join(__dirname, '../addresses');
    if (!fs.existsSync(addressesDir)) {
      fs.mkdirSync(addressesDir, { recursive: true });
    }
    
    const addressesFile = path.join(addressesDir, `${network.name}-${network.chainId}-coupon-nft.json`);
    fs.writeFileSync(addressesFile, JSON.stringify(deploymentResult, null, 2));
    console.log(`\n💾 Deployment info saved to: ${addressesFile}`);

    // Display summary
    console.log("\n🎉 CouponNFT deployment completed successfully!");
    console.log("📋 Summary:");
    console.log(`   Contract Address: ${couponNFTAddress}`);
    console.log(`   Network: ${network.name} (${network.chainId})`);
    console.log(`   Block Explorer: https://${network.chainId === 84532n ? 'sepolia.' : ''}basescan.org/address/${couponNFTAddress}`);

    // Verification instructions
    if (network.chainId === 84532n || network.chainId === 8453n) {
      console.log("\n🔍 To verify the contract, run:");
      console.log(`npx hardhat verify --network ${network.name} ${couponNFTAddress} "${ADMIN_ADDRESS}" "${CDP_WALLET_ADDRESS}" "${NFT_BASE_URI}"`);
    }

    // Next steps
    console.log("\n📝 Next steps:");
    console.log("   1. Verify the contract on BaseScan");
    console.log("   2. Update your environment files with the new contract address");
    console.log("   3. Update the CDP Server Wallet service to use this contract");
    console.log("   4. Test NFT minting through your backend API");
    console.log("   5. Update the main README.md with the verified contract details\n");

    return deploymentResult;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Handle script execution
main()
  .then(() => {
    console.log("✅ CouponNFT deployment script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ CouponNFT deployment script failed:", error);
    process.exit(1);
  });