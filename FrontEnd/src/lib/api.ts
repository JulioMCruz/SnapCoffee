// Ensure URL has proper protocol
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const API_BASE_URL = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

export interface UserConnectionData {
  fid?: number;
  walletAddress?: string;
  username?: string;
  displayName?: string;
  connectionType?: 'wallet_connect' | 'farcaster_auth' | 'demo';
  timestamp?: string;
}

/**
 * Log user connection event to backend
 */
export async function logUserConnection(data: UserConnectionData): Promise<boolean> {
  try {
    console.log('📡 Logging user connection to backend:', data);
    console.log('🔗 Raw Base URL:', import.meta.env.VITE_API_BASE_URL);
    console.log('🔗 Processed API Base URL:', API_BASE_URL);
    const fullUrl = `${API_BASE_URL}/api/farcaster/log-connection`;
    console.log('🌐 Full API URL:', fullUrl);
    console.log('🌍 Environment:', {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_API_SECRET: import.meta.env.VITE_API_SECRET ? 'Present' : 'Missing'
    });
    
    const response = await fetch(`${API_BASE_URL}/api/farcaster/log-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add API key if available
        ...(import.meta.env.VITE_API_SECRET && {
          'x-api-key': import.meta.env.VITE_API_SECRET
        })
      },
      body: JSON.stringify({
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.warn('⚠️ Backend logging failed:', response.status, response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('✅ User connection logged successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ Error logging user connection:', error);
    return false;
  }
}

/**
 * Get user profile from backend
 */
export async function getUserProfile(fid: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/farcaster/user/${fid}`, {
      headers: {
        ...(import.meta.env.VITE_API_SECRET && {
          'x-api-key': import.meta.env.VITE_API_SECRET
        })
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}