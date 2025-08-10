import { Request, Response } from 'express';
import { ApiResponse, CoffeeSnap, CoffeeSnapValidation } from '@/types';
import { config } from '@/config';
import { ImageValidationService } from '@/services/image-validation';
import { StorageService } from '@/services/storage';

export class CoffeeController {
  private imageValidationService = new ImageValidationService();
  private storageService = new StorageService();
  
  /**
   * Validate and process a coffee snap with file upload
   */
  async validateSnap(req: Request, res: Response) {
    try {
      const { userId, fid, location, description } = req.body;
      const imageFile = req.file;
      
      if (!imageFile) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Image file is required',
        };
        return res.status(400).json(response);
      }
      
      if (!userId || !fid || !location) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: userId, fid, location',
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
      
      // Upload image to storage
      const imageUrl = await this.storageService.uploadImage(
        imageFile.buffer,
        `snaps/${userId}/${Date.now()}.jpg`
      );
      
      // Create coffee snap record
      const coffeeSnap: CoffeeSnap = {
        id: `snap_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        fid: parseInt(fid),
        imageUrl,
        imageHash: await this.storageService.generateImageHash(imageFile.buffer),
        location: JSON.parse(location),
        description,
        timestamp: new Date(),
        validated: true,
        rewardAmount: config.REWARDS.COFFEE_SNAP_AMOUNT,
      };
      
      // TODO: Save to database
      console.log('Coffee snap validated:', coffeeSnap.id);
      
      const response: ApiResponse = {
        success: true,
        data: {
          snap: coffeeSnap,
          validation,
          rewardEligible: true,
        },
        message: 'Coffee snap validated successfully',
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
   * Get nearby coffee venues
   */
  async getNearbyVenues(req: Request, res: Response) {
    try {
      const { lat, lng, radius = '1000' } = req.query;
      
      if (!lat || !lng) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Latitude and longitude are required',
        };
        return res.status(400).json(response);
      }
      
      // TODO: Implement Google Places API integration
      const mockVenues = [
        {
          id: 'venue_1',
          name: 'Blue Bottle Coffee',
          address: '123 Main St, San Francisco, CA',
          distance: 150,
          rating: 4.5,
          snapCount: 25,
        },
        {
          id: 'venue_2', 
          name: 'Philz Coffee',
          address: '456 Market St, San Francisco, CA',
          distance: 300,
          rating: 4.3,
          snapCount: 18,
        },
      ];
      
      const response: ApiResponse = {
        success: true,
        data: { venues: mockVenues },
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get nearby venues error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Venues Error',
        message: error.message,
      };
      
      res.status(500).json(response);
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