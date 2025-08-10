import { config } from '@/config';
import axios from 'axios';

export interface FarcasterCastRequest {
  text: string;
  imageUrl?: string;
  embeds?: Array<{
    url?: string;
  }>;
  parent?: string; // For replies
  channel?: string; // Channel key (e.g., 'coffee')
}

export interface FarcasterCastResponse {
  success: boolean;
  cast?: {
    hash: string;
    author: {
      fid: number;
      username: string;
      display_name: string;
    };
    text: string;
    timestamp: string;
    embeds: any[];
  };
  error?: string;
  message?: string;
}

export interface NeynarCastVerification {
  found: boolean;
  cast?: {
    hash: string;
    author: {
      fid: number;
      username: string;
    };
    text: string;
    timestamp: string;
    reactions: {
      likes: number;
      recasts: number;
      replies: number;
    };
    embeds: any[];
  };
  verified: boolean;
  verificationTime?: string;
}

export class FarcasterService {
  private readonly neynarBaseUrl = 'https://api.neynar.com';
  private readonly neynarApiKey = config.NEYNAR_API_KEY;
  private readonly signerUuid = config.FARCASTER_SIGNER_UUID;

  /**
   * Create a Farcaster cast (post)
   */
  async createCast(request: FarcasterCastRequest): Promise<FarcasterCastResponse> {
    try {
      if (!this.neynarApiKey || !this.signerUuid) {
        return {
          success: false,
          error: 'Farcaster Configuration Missing',
          message: 'NEYNAR_API_KEY and FARCASTER_SIGNER_UUID are required',
        };
      }

      const payload: any = {
        signer_uuid: this.signerUuid,
        text: request.text,
      };

      // Add image embed if provided
      if (request.imageUrl) {
        payload.embeds = [
          {
            url: request.imageUrl,
          },
          ...(request.embeds || []),
        ];
      } else if (request.embeds) {
        payload.embeds = request.embeds;
      }

      // Add parent for replies
      if (request.parent) {
        payload.parent = request.parent;
      }

      // Add channel
      if (request.channel) {
        payload.channel_id = request.channel;
      }

      console.log('Creating Farcaster cast:', payload);

      const response = await axios.post(
        `${this.neynarBaseUrl}/v2/farcaster/cast`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.neynarApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        cast: response.data.cast,
      };
    } catch (error: any) {
      console.error('Farcaster cast creation error:', error.response?.data || error.message);
      
      return {
        success: false,
        error: 'Cast Creation Failed',
        message: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Verify cast exists and get its status using Neynar
   */
  async verifyCastExists(castHash: string): Promise<NeynarCastVerification> {
    try {
      if (!this.neynarApiKey) {
        return {
          found: false,
          verified: false,
        };
      }

      console.log(`Verifying cast: ${castHash}`);

      const response = await axios.get(
        `${this.neynarBaseUrl}/v2/farcaster/cast`,
        {
          params: {
            identifier: castHash,
            type: 'hash',
          },
          headers: {
            'Authorization': `Bearer ${this.neynarApiKey}`,
          },
        }
      );

      const cast = response.data.cast;
      
      return {
        found: true,
        cast: {
          hash: cast.hash,
          author: {
            fid: cast.author.fid,
            username: cast.author.username,
          },
          text: cast.text,
          timestamp: cast.timestamp,
          reactions: {
            likes: cast.reactions?.likes_count || 0,
            recasts: cast.reactions?.recasts_count || 0,
            replies: cast.replies?.count || 0,
          },
          embeds: cast.embeds || [],
        },
        verified: true,
        verificationTime: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Cast verification error:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        return {
          found: false,
          verified: false,
        };
      }
      
      return {
        found: false,
        verified: false,
      };
    }
  }

  /**
   * Wait for cast verification with retries
   */
  async waitForCastVerification(
    castHash: string,
    maxRetries: number = 5,
    delayMs: number = 2000
  ): Promise<NeynarCastVerification> {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      const verification = await this.verifyCastExists(castHash);
      
      if (verification.found && verification.verified) {
        return verification;
      }
      
      attempts++;
      
      if (attempts < maxRetries) {
        console.log(`Cast not found yet, retrying in ${delayMs}ms... (${attempts}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return {
      found: false,
      verified: false,
    };
  }

  /**
   * Get user's recent casts
   */
  async getUserCasts(fid: number, limit: number = 25): Promise<any[]> {
    try {
      if (!this.neynarApiKey) {
        return [];
      }

      const response = await axios.get(
        `${this.neynarBaseUrl}/v2/farcaster/casts`,
        {
          params: {
            fid,
            limit,
          },
          headers: {
            'Authorization': `Bearer ${this.neynarApiKey}`,
          },
        }
      );

      return response.data.casts || [];
    } catch (error: any) {
      console.error('Get user casts error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get cast reactions and engagement
   */
  async getCastEngagement(castHash: string) {
    try {
      if (!this.neynarApiKey) {
        return null;
      }

      const response = await axios.get(
        `${this.neynarBaseUrl}/v2/farcaster/cast`,
        {
          params: {
            identifier: castHash,
            type: 'hash',
          },
          headers: {
            'Authorization': `Bearer ${this.neynarApiKey}`,
          },
        }
      );

      const cast = response.data.cast;
      
      return {
        hash: cast.hash,
        reactions: {
          likes: cast.reactions?.likes_count || 0,
          recasts: cast.reactions?.recasts_count || 0,
          replies: cast.replies?.count || 0,
        },
        timestamp: cast.timestamp,
      };
    } catch (error: any) {
      console.error('Get cast engagement error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Generate coffee snap Farcaster post text
   */
  generateCoffeePostText(
    coffeeName: string,
    venueName: string,
    city: string,
    state: string,
    description?: string
  ): string {
    const baseText = `☕ Just snapped a ${coffeeName} at ${venueName} in ${city}, ${state}!`;
    
    const hashtags = '#SnapCoffee #Coffee #Web3 #Base';
    
    if (description && description.trim()) {
      return `${baseText}\n\n${description}\n\n${hashtags}`;
    }
    
    return `${baseText}\n\n${hashtags}`;
  }
}