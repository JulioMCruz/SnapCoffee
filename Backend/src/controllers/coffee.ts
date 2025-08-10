import { Request, Response } from 'express';
import { ApiResponse, CoffeeSnap, CoffeeSnapValidation } from '@/types';
import { config } from '@/config';
import { ImageValidationService } from '@/services/image-validation';
import { StorageService } from '@/services/storage';
import { FarcasterService } from '@/services/farcaster';
import { CoffeeShopService } from '@/services/coffee-shop';
import { GooglePlacesService } from '@/services/places';
import { coffeeRewardAgent } from '@/agents/reward-agent';

export class CoffeeController {
  private imageValidationService = new ImageValidationService();
  private storageService = new StorageService();
  private farcasterService = new FarcasterService();
  private coffeeShopService = new CoffeeShopService();
  private placesService = new GooglePlacesService();
  
  /**
   * Validate and process a coffee snap with file upload
   */
  async validateSnap(req: Request, res: Response) {
    try {
      const { 
        userId, 
        fid, 
        coffeeType, 
        coffeeName, 
        venueName, 
        city, 
        state, 
        rating,
        description 
      } = req.body;
      const imageFile = req.file;
      
      if (!imageFile) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Image file is required',
        };
        return res.status(400).json(response);
      }
      
      if (!userId || !fid || !coffeeType || !coffeeName || !venueName || !city || !state) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: userId, fid, coffeeType, coffeeName, venueName, city, state',
        };
        return res.status(400).json(response);
      }
      
      // Validate image content using AI
      const validation = await this.imageValidationService.validateCoffeeImage(
        imageFile.buffer,
        imageFile.mimetype
      );
      
      if (!validation.isValidCoffee) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid Coffee Image',
          message: 'Image does not appear to contain coffee',
          data: { validation },
        };
        return res.status(400).json(response);
      }
      
      // Upload image to Firebase Storage
      const imageUrl = await this.storageService.uploadImage(
        imageFile.buffer,
        `snaps/${userId}/${Date.now()}.jpg`
      );
      
      // Get or create coffee shop with CDP wallet
      const coffeeShop = await this.coffeeShopService.getOrCreateShop(
        venueName,
        `${city}, ${state}`, // Basic address format
        city,
        state
      );
      
      // Create coffee snap record
      const coffeeSnap: CoffeeSnap = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        fid: parseInt(fid),
        imageUrl,
        imageHash: await this.storageService.generateImageHash(imageFile.buffer),
        location: {
          venueId: coffeeShop.id,
          venueName: coffeeShop.name,
          city: coffeeShop.city,
          state: coffeeShop.state,
        },
        description: `${coffeeType} - ${coffeeName}${description ? ` | ${description}` : ''}`,
        timestamp: new Date(),
        validated: true,
        rewardAmount: config.REWARDS.COFFEE_SNAP_AMOUNT,
      };
      
      // Create Farcaster post and share URL (dual approach like ZodiacCard)
      let farcasterCast = null;
      let warpcastShareUrl = null;
      
      try {
        const postText = this.farcasterService.generateCoffeePostText(
          coffeeName,
          venueName,
          city,
          state,
          description
        );
        
        // Generate Warpcast share URL (ZodiacCard approach)
        warpcastShareUrl = this.farcasterService.generateWarpcastShareUrl(
          coffeeName,
          venueName,
          city,
          state,
          imageUrl,
          description
        );
        
        // Attempt automated posting via Neynar (if signer configured)
        const castResponse = await this.farcasterService.createCast({
          text: postText,
          imageUrl: imageUrl,
          channel: 'coffee', // Post to coffee channel
        });
        
        if (castResponse.success && castResponse.cast) {
          farcasterCast = castResponse.cast;
          console.log('Farcaster cast created:', farcasterCast.hash);
          
          // Wait for cast verification
          setTimeout(async () => {
            const verification = await this.farcasterService.waitForCastVerification(
              farcasterCast!.hash,
              3, // Max 3 retries
              3000 // 3 second delay
            );
            
            if (verification.verified) {
              console.log('Farcaster cast verified, processing rewards...');
              // TODO: Trigger reward distribution to user
              // TODO: Update coffee shop metadata
              await this.coffeeShopService.updateShopMetadata(
                coffeeShop.id,
                1,
                config.REWARDS.COFFEE_SNAP_AMOUNT,
                userId
              );
            } else {
              console.log('Farcaster cast not verified, no additional rewards');
            }
          }, 5000); // Wait 5 seconds before starting verification
        }
      } catch (castError) {
        console.error('Farcaster cast creation failed:', castError);
        // Continue with share URL - user can still post manually
      }
      
      // TODO: Save snap to database
      console.log('Coffee snap validated:', coffeeSnap.id);
      
      const response: ApiResponse = {
        success: true,
        data: {
          snap: coffeeSnap,
          validation,
          coffeeShop,
          farcasterCast,
          warpcastShareUrl, // Include share URL for manual posting
          rewardEligible: true,
        },
        message: 'Coffee snap validated and posted successfully!',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Validate snap error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Snap Validation Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Submit coffee snap with base64 image data
   */
  async submitSnap(req: Request, res: Response) {
    try {
      const { userId, fid, imageData, location, description } = req.body;
      
      if (!userId || !fid || !imageData || !location) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields',
        };
        return res.status(400).json(response);
      }
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64');
      
      // Validate image
      const validation = await this.imageValidationService.validateCoffeeImage(
        imageBuffer,
        'image/jpeg'
      );
      
      // Upload and process similar to validateSnap
      const imageUrl = await this.storageService.uploadImage(
        imageBuffer,
        `snaps/${userId}/${Date.now()}.jpg`
      );
      
      const coffeeSnap: CoffeeSnap = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        fid: parseInt(fid),
        imageUrl,
        imageHash: await this.storageService.generateImageHash(imageBuffer),
        location: typeof location === 'string' ? JSON.parse(location) : location,
        description,
        timestamp: new Date(),
        validated: validation.isValidCoffee,
        rewardAmount: validation.isValidCoffee ? config.REWARDS.COFFEE_SNAP_AMOUNT : '0',
      };
      
      const response: ApiResponse = {
        success: true,
        data: { snap: coffeeSnap, validation },
        message: 'Coffee snap submitted successfully',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Submit snap error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Snap Submission Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Get paginated coffee snap feed
   */
  async getFeed(req: Request, res: Response) {
    try {
      const { page = '1', limit = '20', userId, venueId } = req.query;
      
      // TODO: Implement actual database query
      // Mock feed data for now
      const mockSnaps: CoffeeSnap[] = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
        id: `snap_${i}`,
        userId: `user_${i % 5}`,
        fid: 100000 + i,
        imageUrl: `https://picsum.photos/400/300?random=${i}`,
        imageHash: `hash_${i}`,
        location: {
          venueId: `venue_${i % 10}`,
          venueName: `Coffee Shop ${i % 10}`,
        },
        description: `Enjoying coffee #${i}`,
        timestamp: new Date(Date.now() - i * 3600000),
        validated: true,
        rewardAmount: '10',
      }));
      
      const response: ApiResponse = {
        success: true,
        data: {
          snaps: mockSnaps,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 1000,
            pages: Math.ceil(1000 / parseInt(limit as string)),
          },
        },
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get feed error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Feed Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Get user's coffee snaps
   */
  async getUserSnaps(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      
      // TODO: Implement actual database query
      const mockSnaps: CoffeeSnap[] = Array.from({ length: 5 }, (_, i) => ({
        id: `snap_${userId}_${i}`,
        userId,
        fid: 123456,
        imageUrl: `https://picsum.photos/400/300?random=${userId}_${i}`,
        imageHash: `hash_${userId}_${i}`,
        location: {
          venueId: `venue_${i}`,
          venueName: `Coffee Shop ${i}`,
        },
        description: `My coffee #${i}`,
        timestamp: new Date(Date.now() - i * 86400000),
        validated: true,
        rewardAmount: '10',
      }));
      
      const response: ApiResponse = {
        success: true,
        data: {
          snaps: mockSnaps,
          stats: {
            totalSnaps: mockSnaps.length,
            totalRewards: (mockSnaps.length * 10).toString(),
            avgPerDay: '2.5',
          },
        },
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get user snaps error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'User Snaps Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Get nearby coffee venues using Google Places API
   */
  async getNearbyVenues(req: Request, res: Response) {
    try {
      const { lat, lng, radius = '1500', fallback } = req.query;
      
      if (!lat || !lng) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Latitude and longitude are required',
        };
        return res.status(400).json(response);
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const searchRadius = parseInt(radius as string);
      
      console.log(`Searching for coffee shops near: ${latitude}, ${longitude} (radius: ${searchRadius}m)`);
      
      // Search for coffee shops using Google Places API
      const coffeeShops = await this.placesService.searchCoffeeShops({
        location: {
          lat: latitude,
          lng: longitude,
        },
        radius: searchRadius,
      });
      
      // Transform to our venue format
      const venues = coffeeShops.map(shop => ({
        id: shop.placeId,
        name: shop.name,
        address: shop.address,
        distance: shop.distance,
        rating: shop.rating,
        openNow: shop.openNow,
        priceLevel: shop.priceLevel,
        snapCount: 0, // TODO: Get from database
      }));
      
      console.log(`Found ${venues.length} coffee shops`);
      
      const response: ApiResponse = {
        success: true,
        data: { 
          venues,
          location: { lat: latitude, lng: longitude },
          radius: searchRadius,
          usedFallback: fallback === 'true', // Indicate if fallback location was used
        },
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get nearby venues error:', error);
      
      // If Places API fails, return mock venues
      const mockVenues = [
        {
          id: 'mock_1',
          name: 'Local Coffee Shop',
          address: 'Near you',
          distance: 100,
          rating: 4.2,
          openNow: true,
          priceLevel: 2,
          snapCount: 0,
        },
        {
          id: 'mock_2',
          name: 'Café Central',
          address: 'Downtown',
          distance: 250,
          rating: 4.5,
          openNow: true,
          priceLevel: 3,
          snapCount: 0,
        },
        {
          id: 'mock_3',
          name: 'The Roastery',
          address: 'Main Street',
          distance: 400,
          rating: 4.3,
          openNow: false,
          priceLevel: 2,
          snapCount: 0,
        },
      ];
      
      const response: ApiResponse = {
        success: true,
        data: {
          venues: mockVenues,
          location: { lat: parseFloat(lat as string), lng: parseFloat(lng as string) },
          radius: parseInt(radius as string),
          usedMockData: true,
        },
        message: 'Using sample venues - Google Places API unavailable',
      };
      
      res.json(response);
    }
  }
  
  /**
   * Get venue statistics
   */
  async getVenueStats(req: Request, res: Response) {
    try {
      const { venueId } = req.params;
      
      const mockStats = {
        venueId,
        name: 'Blue Bottle Coffee',
        totalSnaps: 125,
        totalRewards: '1250',
        topSnappers: [
          { userId: 'user_1', username: 'coffee_lover', snapCount: 15 },
          { userId: 'user_2', username: 'bean_counter', snapCount: 12 },
        ],
        recentActivity: 85, // snaps in last 7 days
      };
      
      const response: ApiResponse = {
        success: true,
        data: mockStats,
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get venue stats error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Venue Stats Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Get coffee snap leaderboard
   */
  async getLeaderboard(req: Request, res: Response) {
    try {
      const { timeframe = 'week', limit = '10' } = req.query;
      
      // TODO: Implement actual database query
      const mockLeaderboard = Array.from({ length: parseInt(limit as string) }, (_, i) => ({
        rank: i + 1,
        userId: `user_${i}`,
        username: `coffee_user_${i}`,
        fid: 100000 + i,
        snapCount: 50 - i * 3,
        totalRewards: ((50 - i * 3) * 10).toString(),
        pfpUrl: `https://via.placeholder.com/150?text=User${i}`,
      }));
      
      const response: ApiResponse = {
        success: true,
        data: {
          leaderboard: mockLeaderboard,
          timeframe,
          lastUpdated: new Date().toISOString(),
        },
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get leaderboard error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Leaderboard Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
}