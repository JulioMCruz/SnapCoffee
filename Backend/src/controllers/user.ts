import { Request, Response } from 'express';
import { ApiResponse } from '@/types';

export class UserController {
  /**
   * Get user profile by FID
   */
  async getUserProfile(req: Request, res: Response) {
    try {
      const { fid } = req.params;
      
      if (!fid) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'User FID is required',
        };
        return res.status(400).json(response);
      }
      
      // TODO: Get user data from database
      // For now, return mock data
      const mockUser = {
        fid: parseInt(fid),
        displayName: 'Coffee Enthusiast',
        username: `user${fid}`,
        bio: 'Passionate coffee lover exploring the best local cafés and sharing my journey with the community.',
        pfpUrl: 'https://imagedelivery.net/BXluQx4ige9GuW0Ia56BHw/3cef26d3-9f0a-4c12-160a-47082c268d00/original',
        followerCount: 1234,
        followingCount: 567,
        coffeeCount: 89,
        totalTips: 45.67,
        recentTips: 12.34,
        joinedDate: '2024-01-15T10:30:00Z',
        badges: ['Early Adopter', 'Coffee Connoisseur', 'Top Tipper'],
        topCafes: ['Blue Bottle Coffee', 'Philz Coffee', 'Ritual Coffee Roasters'],
        recentPosts: [
          {
            id: 'post_1',
            cafe: 'Blue Bottle Coffee',
            location: 'Oakland, CA',
            coffeeType: 'Gibraltar',
            rating: 5,
            pairing: 'almond croissant',
            likes: 23,
            tips: 5.50,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop'
          },
          {
            id: 'post_2', 
            cafe: 'Philz Coffee',
            location: 'San Francisco, CA',
            coffeeType: 'Tesora Blend',
            rating: 4,
            pairing: 'blueberry muffin',
            likes: 18,
            tips: 3.25,
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
            image: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=300&fit=crop'
          },
          {
            id: 'post_3',
            cafe: 'Ritual Coffee',
            location: 'San Francisco, CA', 
            coffeeType: 'Espresso',
            rating: 5,
            pairing: 'dark chocolate',
            likes: 31,
            tips: 8.75,
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop'
          }
        ],
        achievements: [
          {
            name: 'Early Bird',
            description: 'One of the first 100 users to join',
            icon: '🐣'
          },
          {
            name: 'Coffee Connoisseur',
            description: 'Tried coffee at 50+ different cafés',
            icon: '☕'
          },
          {
            name: 'Generous Tipper',
            description: 'Sent over $100 in tips to creators',
            icon: '💰'
          }
        ]
      };
      
      const response: ApiResponse = {
        success: true,
        data: mockUser,
        message: 'User profile retrieved successfully',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get user profile error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'User Profile Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Get user balance
   */
  async getUserBalance(req: Request, res: Response) {
    try {
      const { address } = req.query;
      
      if (!address) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Wallet address is required',
        };
        return res.status(400).json(response);
      }
      
      // TODO: Get actual balance from blockchain/database
      // For now, return mock balance
      const mockBalance = {
        address: address as string,
        balance: 127.50, // USDC balance
        lastUpdated: new Date().toISOString(),
      };
      
      const response: ApiResponse = {
        success: true,
        data: mockBalance,
        message: 'Balance retrieved successfully',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Get user balance error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Balance Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
}