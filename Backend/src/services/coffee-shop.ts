import { config } from '@/config';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

export interface CoffeeShop {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  walletId: string;
  walletAddress: string;
  placeId?: string; // Google Places ID
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  metadata: {
    totalSnaps: number;
    totalRewards: string; // Total $BEAN rewarded
    activeUsers: number;
  };
}

export interface CoffeeShopCreationRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  placeId?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class CoffeeShopService {
  private coinbase: Coinbase;
  
  constructor() {
    // Initialize Coinbase SDK
    this.coinbase = Coinbase.configure({
      apiKeyName: config.CDP_API_KEY,
      privateKey: config.CDP_API_SECRET,
    });
  }

  /**
   * Create a new coffee shop with CDP server wallet
   */
  async createCoffeeShop(request: CoffeeShopCreationRequest): Promise<CoffeeShop> {
    try {
      console.log('Creating coffee shop:', request.name);

      // Generate unique shop ID
      const shopId = this.generateShopId(request.name, request.city, request.state);

      // Create CDP server wallet for the coffee shop
      const wallet = await this.createShopWallet(shopId);
      
      const coffeeShop: CoffeeShop = {
        id: shopId,
        name: request.name,
        address: request.address,
        city: request.city,
        state: request.state,
        walletId: wallet.getId(),
        walletAddress: wallet.getDefaultAddress()!.getId(),
        placeId: request.placeId,
        coordinates: request.coordinates,
        createdAt: new Date(),
        metadata: {
          totalSnaps: 0,
          totalRewards: '0',
          activeUsers: 0,
        },
      };

      // TODO: Save to database
      console.log('Coffee shop created:', coffeeShop);
      
      return coffeeShop;
    } catch (error) {
      console.error('Coffee shop creation error:', error);
      throw new Error('Failed to create coffee shop');
    }
  }

  /**
   * Create CDP server wallet for coffee shop
   */
  private async createShopWallet(shopId: string): Promise<Wallet> {
    try {
      console.log(`Creating CDP wallet for shop: ${shopId}`);
      
      const wallet = await Wallet.create({
        networkId: config.NODE_ENV === 'production' ? Coinbase.networks.Base : Coinbase.networks.BaseSepolia,
      });
      
      // Fund wallet with a small amount for initial transactions (testnet only)
      if (config.NODE_ENV !== 'production') {
        try {
          const faucetTx = await wallet.faucet();
          await faucetTx.wait();
          console.log(`Funded shop wallet: ${wallet.getDefaultAddress()!.getId()}`);
        } catch (faucetError) {
          console.warn('Faucet funding failed (may not be available):', faucetError);
        }
      }
      
      return wallet;
    } catch (error) {
      console.error('CDP wallet creation error:', error);
      throw new Error('Failed to create shop wallet');
    }
  }

  /**
   * Get or create coffee shop by location details
   */
  async getOrCreateShop(
    name: string,
    address: string,
    city: string,
    state: string,
    placeId?: string
  ): Promise<CoffeeShop> {
    try {
      // Generate shop ID for lookup
      const shopId = this.generateShopId(name, city, state);
      
      // TODO: Check if shop exists in database
      // For now, always create new (in production, check database first)
      
      const existingShop = await this.findShopById(shopId);
      if (existingShop) {
        console.log('Found existing coffee shop:', shopId);
        return existingShop;
      }
      
      // Create new shop
      return await this.createCoffeeShop({
        name,
        address,
        city,
        state,
        placeId,
      });
    } catch (error) {
      console.error('Get or create shop error:', error);
      throw new Error('Failed to get or create coffee shop');
    }
  }

  /**
   * Find coffee shop by ID
   */
  async findShopById(shopId: string): Promise<CoffeeShop | null> {
    try {
      // TODO: Implement database lookup
      // For now, return null (no persistence yet)
      return null;
    } catch (error) {
      console.error('Find shop by ID error:', error);
      return null;
    }
  }

  /**
   * Update coffee shop metadata after snap validation
   */
  async updateShopMetadata(
    shopId: string,
    snapCount: number,
    rewardAmount: string,
    userId: string
  ): Promise<void> {
    try {
      // TODO: Implement database update
      console.log(`Updating shop ${shopId} metadata:`, {
        newSnap: snapCount,
        reward: rewardAmount,
        user: userId,
      });
      
      // In production, this would update:
      // - totalSnaps += 1
      // - totalRewards += rewardAmount
      // - activeUsers (unique users who snapped)
    } catch (error) {
      console.error('Update shop metadata error:', error);
      throw new Error('Failed to update shop metadata');
    }
  }

  /**
   * Get coffee shop statistics
   */
  async getShopStats(shopId: string): Promise<CoffeeShop['metadata'] | null> {
    try {
      const shop = await this.findShopById(shopId);
      return shop?.metadata || null;
    } catch (error) {
      console.error('Get shop stats error:', error);
      return null;
    }
  }

  /**
   * Transfer rewards to coffee shop wallet (future feature)
   */
  async transferToShop(
    shopId: string,
    amount: string,
    tokenAddress: string
  ): Promise<string | null> {
    try {
      const shop = await this.findShopById(shopId);
      if (!shop) {
        throw new Error('Coffee shop not found');
      }

      // TODO: Implement token transfer to shop wallet
      // This would be used for revenue sharing with coffee shops
      console.log(`Transfer ${amount} tokens to shop ${shopId}:`, shop.walletAddress);
      
      return null; // Transaction hash would be returned
    } catch (error) {
      console.error('Transfer to shop error:', error);
      throw new Error('Failed to transfer to coffee shop');
    }
  }

  /**
   * Get nearby coffee shops
   */
  async getNearbyShops(
    lat: number,
    lng: number,
    radiusKm: number = 5
  ): Promise<CoffeeShop[]> {
    try {
      // TODO: Implement geospatial database query
      // For now, return empty array
      console.log(`Finding shops near ${lat},${lng} within ${radiusKm}km`);
      return [];
    } catch (error) {
      console.error('Get nearby shops error:', error);
      return [];
    }
  }

  /**
   * Generate consistent shop ID from location data
   */
  private generateShopId(name: string, city: string, state: string): string {
    const normalized = `${name.toLowerCase()}-${city.toLowerCase()}-${state.toLowerCase()}`
      .replace(/[^a-z0-9\-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `shop_${normalized}`;
  }

  /**
   * Validate coffee shop data
   */
  validateShopData(request: CoffeeShopCreationRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.name?.trim()) {
      errors.push('Coffee shop name is required');
    }
    
    if (!request.address?.trim()) {
      errors.push('Address is required');
    }
    
    if (!request.city?.trim()) {
      errors.push('City is required');
    }
    
    if (!request.state?.trim()) {
      errors.push('State is required');
    }
    
    if (request.coordinates) {
      if (typeof request.coordinates.lat !== 'number' || 
          request.coordinates.lat < -90 || 
          request.coordinates.lat > 90) {
        errors.push('Invalid latitude');
      }
      
      if (typeof request.coordinates.lng !== 'number' || 
          request.coordinates.lng < -180 || 
          request.coordinates.lng > 180) {
        errors.push('Invalid longitude');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * List all coffee shops (for admin)
   */
  async listAllShops(): Promise<CoffeeShop[]> {
    try {
      // TODO: Implement database query
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('List all shops error:', error);
      return [];
    }
  }
}