import { Coinbase, Wallet, WalletData } from '@coinbase/coinbase-sdk';
import { config } from '@/config';

export class CDPWalletService {
  private coinbase: Coinbase;
  private wallet: Wallet | null = null;
  
  constructor() {
    // Initialize Coinbase SDK
    this.coinbase = new Coinbase({
      apiKeyName: config.CDP_API_KEY,
      privateKey: config.CDP_API_SECRET.replace(/\\n/g, '\n'), // Handle newlines in env vars
    });
  }
  
  /**
   * Initialize or load existing wallet
   */
  async initializeWallet(): Promise<Wallet> {
    try {
      if (this.wallet) {
        return this.wallet;
      }
      
      if (config.CDP_WALLET_ID) {
        // Load existing wallet
        console.log('Loading existing CDP wallet:', config.CDP_WALLET_ID);
        this.wallet = await this.coinbase.getWallet(config.CDP_WALLET_ID);
      } else {
        // Create new wallet
        console.log('Creating new CDP wallet...');
        this.wallet = await this.coinbase.createWallet();
        console.log('Created CDP wallet:', this.wallet.getId());
        console.log('⚠️  Save this wallet ID to your .env file: CDP_WALLET_ID=' + this.wallet.getId());
      }
      
      return this.wallet;
    } catch (error) {
      console.error('Failed to initialize CDP wallet:', error);
      throw new Error('CDP wallet initialization failed');
    }
  }
  
  /**
   * Get wallet address on Base network
   */
  async getWalletAddress(): Promise<string> {
    const wallet = await this.initializeWallet();
    const address = await wallet.getDefaultAddress();
    return address.getId();
  }
  
  /**
   * Get wallet balance
   */
  async getBalance(asset: string = 'eth'): Promise<string> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();
      const balance = await address.getBalance(asset);
      
      return balance.toString();
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  }
  
  /**
   * Mint ERC20 tokens (for $BEAN rewards)
   */
  async mintTokens(
    tokenContractAddress: string,
    recipientAddress: string,
    amount: string
  ): Promise<string> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();
      
      // Prepare mint transaction
      const mintData = this.encodeMintFunction(recipientAddress, amount);
      
      const transaction = await address.invokeContract({
        contractAddress: tokenContractAddress,
        method: 'mint',
        args: {
          to: recipientAddress,
          amount: amount,
        },
      });
      
      // Wait for transaction confirmation
      const result = await transaction.wait();
      
      console.log('Token mint successful:', {
        transactionHash: result.getTransactionHash(),
        recipient: recipientAddress,
        amount,
      });
      
      return result.getTransactionHash();
    } catch (error) {
      console.error('Token mint failed:', error);
      throw new Error('Token mint failed');
    }
  }
  
  /**
   * Mint ERC721 NFT (for coffee coupons)
   */
  async mintNFT(
    nftContractAddress: string,
    recipientAddress: string,
    tokenId: string,
    metadata: any
  ): Promise<string> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();
      
      const transaction = await address.invokeContract({
        contractAddress: nftContractAddress,
        method: 'safeMint',
        args: {
          to: recipientAddress,
          tokenId: tokenId,
          uri: JSON.stringify(metadata),
        },
      });
      
      const result = await transaction.wait();
      
      console.log('NFT mint successful:', {
        transactionHash: result.getTransactionHash(),
        recipient: recipientAddress,
        tokenId,
      });
      
      return result.getTransactionHash();
    } catch (error) {
      console.error('NFT mint failed:', error);
      throw new Error('NFT mint failed');
    }
  }
  
  /**
   * Send ETH or tokens
   */
  async sendTransaction(
    recipientAddress: string,
    amount: string,
    asset: string = 'eth'
  ): Promise<string> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();
      
      const transaction = await address.transfer({
        amount: amount,
        assetId: asset,
        destination: recipientAddress,
      });
      
      const result = await transaction.wait();
      
      console.log('Transfer successful:', {
        transactionHash: result.getTransactionHash(),
        recipient: recipientAddress,
        amount,
        asset,
      });
      
      return result.getTransactionHash();
    } catch (error) {
      console.error('Transfer failed:', error);
      throw new Error('Transfer failed');
    }
  }
  
  /**
   * Deploy smart contract
   */
  async deployContract(
    contractName: string,
    constructorArgs: any[] = []
  ): Promise<{ address: string; transactionHash: string }> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();
      
      // TODO: Implement contract deployment
      // This would require contract bytecode and ABI
      throw new Error('Contract deployment not implemented yet');
    } catch (error) {
      console.error('Contract deployment failed:', error);
      throw new Error('Contract deployment failed');
    }
  }
  
  /**
   * Call smart contract function (read-only)
   */
  async callContract(
    contractAddress: string,
    methodName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const wallet = await this.initializeWallet();
      const address = await wallet.getDefaultAddress();
      
      // TODO: Implement contract call
      // This would require contract ABI
      throw new Error('Contract call not implemented yet');
    } catch (error) {
      console.error('Contract call failed:', error);
      throw new Error('Contract call failed');
    }
  }
  
  /**
   * Export wallet data for backup
   */
  async exportWallet(): Promise<WalletData> {
    try {
      const wallet = await this.initializeWallet();
      const walletData = wallet.export();
      
      console.log('⚠️  Wallet exported - store this data securely!');
      return walletData;
    } catch (error) {
      console.error('Wallet export failed:', error);
      throw new Error('Wallet export failed');
    }
  }
  
  /**
   * Import wallet from backup data
   */
  async importWallet(walletData: WalletData): Promise<Wallet> {
    try {
      this.wallet = await this.coinbase.importWallet(walletData);
      console.log('Wallet imported successfully:', this.wallet.getId());
      return this.wallet;
    } catch (error) {
      console.error('Wallet import failed:', error);
      throw new Error('Wallet import failed');
    }
  }
  
  /**
   * Helper: Encode mint function for ERC20
   */
  private encodeMintFunction(to: string, amount: string): string {
    // This would typically use ethers.js or web3 to encode the function call
    // For now, return placeholder
    return `mint(${to}, ${amount})`;
  }
  
  /**
   * Check if wallet is initialized
   */
  isInitialized(): boolean {
    return this.wallet !== null;
  }
  
  /**
   * Get wallet ID
   */
  getWalletId(): string | null {
    return this.wallet?.getId() || null;
  }
}