import { Request, Response } from 'express';
import { ApiResponse, FarcasterWebhookPayload, FarcasterUser } from '@/types';
import { logUserConnectionToFirebase } from '@/services/firebase';

export class FarcasterController {
  
  /**
   * Handle Farcaster Mini App webhook
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      const payload: FarcasterWebhookPayload = req.body;
      
      console.log('Farcaster webhook received:', {
        fid: payload.untrustedData.fid,
        url: payload.untrustedData.url,
        timestamp: payload.untrustedData.timestamp,
      });
      
      // Process webhook based on the action
      const result = await this.processWebhookAction(payload);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Webhook processed successfully',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('Farcaster webhook error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Webhook Processing Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Get user profile from Farcaster
   */
  async getUserProfile(req: Request, res: Response) {
    try {
      const { fid } = req.params;
      
      // TODO: Implement actual Farcaster API call
      // For now, return mock data
      const userProfile: FarcasterUser = {
        fid: parseInt(fid),
        username: `user${fid}`,
        displayName: `Coffee User ${fid}`,
        pfpUrl: 'https://via.placeholder.com/150',
        custodyAddress: '0x1234567890abcdef1234567890abcdef12345678',
        connectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
      };
      
      const response: ApiResponse = {
        success: true,
        data: userProfile,
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
   * Log user connection events
   */
  async logUserConnection(req: Request, res: Response) {
    try {
      const { 
        fid, 
        walletAddress, 
        username, 
        displayName, 
        connectionType = 'wallet_connect',
        timestamp = new Date().toISOString() 
      } = req.body;
      
      // Log connection to console
      console.log('🔗 USER CONNECTION EVENT:', {
        fid,
        walletAddress,
        username,
        displayName,
        connectionType,
        timestamp,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        headers: {
          origin: req.get('Origin'),
          referer: req.get('Referer')
        }
      });
      
      // Save to Firebase database
      try {
        const firebaseResult = await logUserConnectionToFirebase({
          fid,
          walletAddress,
          username,
          displayName,
          connectionType,
          timestamp,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress,
          origin: req.get('Origin'),
          referer: req.get('Referer')
        });
        
        if (firebaseResult) {
          console.log('✅ User successfully saved to Firebase:', fid);
        } else {
          console.warn('⚠️ Failed to save user to Firebase:', fid);
        }
      } catch (firebaseError) {
        console.error('❌ Firebase save error:', firebaseError);
      }
      
      const response: ApiResponse = {
        success: true,
        data: {
          logged: true,
          fid,
          walletAddress,
          connectionType,
          timestamp
        },
        message: 'User connection logged successfully',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('❌ User connection logging error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Connection Logging Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Validate Farcaster user authentication
   */
  async validateUser(req: Request, res: Response) {
    try {
      const { fid, signature, message } = req.body;
      
      // TODO: Implement proper signature validation
      // For now, just validate the presence of required fields
      if (!fid || !signature || !message) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields: fid, signature, message',
        };
        return res.status(400).json(response);
      }
      
      const validationResult = {
        valid: true,
        fid: parseInt(fid),
        verified: true,
        timestamp: new Date().toISOString(),
      };
      
      const response: ApiResponse = {
        success: true,
        data: validationResult,
        message: 'User validation successful',
      };
      
      res.json(response);
    } catch (error: any) {
      console.error('User validation error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'User Validation Error',
        message: error.message,
      };
      
      res.status(500).json(response);
    }
  }
  
  /**
   * Process webhook actions based on payload
   */
  private async processWebhookAction(payload: FarcasterWebhookPayload) {
    const { untrustedData } = payload;
    
    // Determine action based on URL or button press
    if (untrustedData.url.includes('/snap')) {
      return this.handleSnapAction(payload);
    } else if (untrustedData.url.includes('/redeem')) {
      return this.handleRedeemAction(payload);
    } else if (untrustedData.url.includes('/profile')) {
      return this.handleProfileAction(payload);
    }
    
    return {
      action: 'unknown',
      processed: false,
      message: 'Unknown webhook action',
    };
  }
  
  /**
   * Handle snap-related webhook actions
   */
  private async handleSnapAction(payload: FarcasterWebhookPayload) {
    const { fid } = payload.untrustedData;
    
    return {
      action: 'snap',
      processed: true,
      fid,
      message: 'Snap action processed',
      redirectUrl: '/snap',
    };
  }
  
  /**
   * Handle redeem-related webhook actions
   */
  private async handleRedeemAction(payload: FarcasterWebhookPayload) {
    const { fid } = payload.untrustedData;
    
    return {
      action: 'redeem',
      processed: true,
      fid,
      message: 'Redeem action processed',
      redirectUrl: '/redeem',
    };
  }
  
  /**
   * Handle profile-related webhook actions
   */
  private async handleProfileAction(payload: FarcasterWebhookPayload) {
    const { fid } = payload.untrustedData;
    
    return {
      action: 'profile',
      processed: true,
      fid,
      message: 'Profile action processed',
      redirectUrl: '/profile',
    };
  }
}