// Core API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Farcaster Types
export interface FarcasterUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  custodyAddress: string;
  connectedAddress?: string;
}

export interface FarcasterWebhookPayload {
  untrustedData: {
    fid: number;
    url: string;
    messageHash: string;
    timestamp: number;
    network: number;
    buttonIndex?: number;
    inputText?: string;
    state?: string;
  };
  trustedData: {
    messageBytes: string;
  };
}

// Coffee Snap Types
export interface CoffeeSnap {
  id: string;
  userId: string;
  fid: number;
  imageUrl: string;
  imageHash: string;
  location: {
    venueId: string; // Hashed PlaceID for privacy
    venueName: string;
    latitude?: number; // Optional for privacy
    longitude?: number; // Optional for privacy
  };
  description?: string;
  timestamp: Date;
  validated: boolean;
  rewardAmount?: string; // $BEAN tokens earned
  transactionHash?: string; // Mint transaction
}

export interface CoffeeSnapValidation {
  isValidCoffee: boolean;
  confidence: number;
  reasons: string[];
  metadata: {
    hasText: boolean;
    hasCoffeeItems: boolean;
    locationValid: boolean;
    duplicateCheck: boolean;
  };
}

// NFT Coupon Types
export interface NFTCoupon {
  id: string;
  tokenId: string;
  userId: string;
  fid: number;
  contractAddress: string;
  imageUrl: string;
  metadata: {
    name: string;
    description: string;
    venueId?: string;
    expiryDate?: Date;
    discountPercent?: number;
    maxUses: number;
    usedCount: number;
  };
  mintTransactionHash: string;
  redeemed: boolean;
  redeemedAt?: Date;
  redeemedTransactionHash?: string;
}

// CDP Onramp Types
export interface OnrampSession {
  sessionId: string;
  userId: string;
  amount: string;
  currency: string;
  destinationWallet: string;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
}

// Venue Types
export interface CoffeeVenue {
  id: string;
  placeId: string; // Google Places ID
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  metadata: {
    rating?: number;
    priceLevel?: number;
    photos?: string[];
    hours?: any;
  };
  snapCount: number;
  totalRewards: string; // Total $BEAN distributed
}

// Smart Contract Types
export interface ContractAddresses {
  LOYALTY_TOKEN: string; // ERC20 $BEAN
  COUPON_NFT: string;    // ERC721 Coupons
  SNAP_REGISTRY: string; // Event logging
}

// Blockchain Types
export interface TransactionRequest {
  to: string;
  data: string;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface BlockchainEvent {
  eventName: string;
  transactionHash: string;
  blockNumber: number;
  args: Record<string, any>;
  timestamp: Date;
}

// Database Types (for future implementation)
export interface User {
  id: string;
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  walletAddress: string;
  totalSnaps: number;
  totalTokens: string;
  totalCoupons: number;
  joinedAt: Date;
  lastActiveAt: Date;
}

// Request/Response Types
export interface ValidateSnapRequest {
  userId: string;
  fid: number;
  imageData: string; // base64 or URL
  location: {
    venueId: string;
    venueName: string;
    latitude?: number;
    longitude?: number;
  };
  description?: string;
}

export interface MintRewardRequest {
  userId: string;
  amount: string;
  reason: 'coffee_snap' | 'milestone' | 'bonus';
  metadata?: Record<string, any>;
}

export interface CreateOnrampRequest {
  userId: string;
  amount: string;
  currency: string;
  destinationWallet: string;
}

// Error Types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}