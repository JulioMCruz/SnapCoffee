import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = {
  BASE_RPC_URL: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  BASE_SEPOLIA_RPC_URL: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
  PRIVATE_KEY: process.env.PRIVATE_KEY || "",
  BASESCAN_API_KEY: process.env.BASESCAN_API_KEY || "",
  COINMARKETCAP_API_KEY: process.env.COINMARKETCAP_API_KEY || "",
};

// Warn if required env vars are missing
if (!requiredEnvVars.PRIVATE_KEY && process.env.NODE_ENV !== "test") {
  console.warn("⚠️  PRIVATE_KEY not found in environment variables");
}

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: "10000000000000000000000", // 10,000 ETH
      },
    },
    
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    
    // Base Sepolia Testnet
    "base-sepolia": {
      url: requiredEnvVars.BASE_SEPOLIA_RPC_URL,
      chainId: 84532,
      accounts: requiredEnvVars.PRIVATE_KEY ? [requiredEnvVars.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gasMultiplier: 1.2,
    },
    
    // Base Mainnet
    base: {
      url: requiredEnvVars.BASE_RPC_URL,
      chainId: 8453,
      accounts: requiredEnvVars.PRIVATE_KEY ? [requiredEnvVars.PRIVATE_KEY] : [],
      gasPrice: "auto",
      gasMultiplier: 1.1,
    },
  },
  
  etherscan: {
    apiKey: {
      "base-sepolia": requiredEnvVars.BASESCAN_API_KEY,
      base: requiredEnvVars.BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    coinmarketcap: requiredEnvVars.COINMARKETCAP_API_KEY,
    gasPrice: 1, // Base network typical gas price in gwei
    showTimeSpent: true,
    showMethodSig: true,
  },
  
  contractSizer: {
    alphaSort: true,
    runOnCompile: true,
    disambiguatePaths: false,
  },
  
  mocha: {
    timeout: 60000, // 60 seconds
  },
  
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;