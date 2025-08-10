// Frontend API Client Helper
// Copy this to your frontend project for secure backend communication

// For Next.js projects use NEXT_PUBLIC_, for Vite projects use VITE_
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_KEY = process.env.NEXT_PUBLIC_API_SECRET || process.env.VITE_API_SECRET || 'snap_coffee_super_secure_api_secret_key_2024_production_ready';

/**
 * Secure API client for communicating with Snap Coffee backend
 */
export class SnapCoffeeAPI {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL?: string, apiKey?: string) {
    this.baseURL = baseURL || API_BASE_URL;
    this.apiKey = apiKey || API_KEY;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Rewards API
  async mintRewards(userId: string, amount: string, reason: string, metadata?: any) {
    return this.request('/api/rewards/mint', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, reason, metadata }),
    });
  }

  async getUserBalance(userId: string) {
    return this.request(`/api/rewards/user/${userId}/balance`);
  }

  async getRewardHistory(userId: string, page = 1, limit = 10) {
    return this.request(`/api/rewards/user/${userId}/history?page=${page}&limit=${limit}`);
  }

  async claimRewards(userId: string, rewardIds: string[]) {
    return this.request('/api/rewards/claim', {
      method: 'POST',
      body: JSON.stringify({ userId, rewardIds }),
    });
  }

  // Coupons API
  async mintCoupon(userId: string, metadata?: any) {
    return this.request('/api/coupons/mint', {
      method: 'POST',
      body: JSON.stringify({ userId, metadata }),
    });
  }

  async getUserCoupons(userId: string, status = 'all', page = 1, limit = 10) {
    return this.request(`/api/coupons/user/${userId}?status=${status}&page=${page}&limit=${limit}`);
  }

  async redeemCoupon(couponId: string, venueId: string, redeemCode?: string) {
    return this.request('/api/coupons/redeem', {
      method: 'POST',
      body: JSON.stringify({ couponId, venueId, redeemCode }),
    });
  }

  // Onramp API
  async createOnrampSession(userId: string, amount: string, currency = 'USD', destinationWallet: string) {
    return this.request('/api/onramp/create-session', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, currency, destinationWallet }),
    });
  }

  async processTip(fromUserId: string, toUserId: string, amount: string, currency = 'USD') {
    return this.request('/api/onramp/tip', {
      method: 'POST',
      body: JSON.stringify({ fromUserId, toUserId, amount, currency }),
    });
  }

  // Public APIs (no auth required)
  async getRewardStats() {
    return this.request('/api/rewards/stats');
  }

  async getHealth() {
    return this.request('/api/health');
  }
}

// Default export for easy usage
export default new SnapCoffeeAPI();

// Usage example:
// import api from './api-client';
// 
// try {
//   const balance = await api.getUserBalance('user123');
//   console.log('User balance:', balance.data.balance);
// } catch (error) {
//   console.error('API error:', error.message);
// }