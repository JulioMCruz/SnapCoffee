import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { logUserConnection } from '@/lib/api';

export interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  custodyAddress: string;
  connectedAddress?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
}

interface FarcasterContextType {
  user: FarcasterUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined);

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (context === undefined) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}

interface FarcasterProviderProps {
  children: ReactNode;
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting to get Farcaster context...');
      console.log('🔍 API function imported:', typeof logUserConnection);
      
      // Get the context which contains user information
      const context = await sdk.context;
      console.log('📱 SDK context:', context);
      
      if (!context?.user && !context?.client) {
        throw new Error('No user context available from SDK');
      }

      // Extract real user data from context
      const contextUser = context.user;
      const farcasterUser: FarcasterUser = {
        fid: contextUser?.fid || context.client?.clientFid || 123456,
        username: contextUser?.username || 'coffeeluver',
        displayName: contextUser?.displayName || contextUser?.username || 'Coffee Lover',
        pfpUrl: contextUser?.pfpUrl || '/placeholder.svg',
        custodyAddress: contextUser?.custodyAddress || '0x1234567890abcdef1234567890abcdef12345678',
        connectedAddress: contextUser?.verifications?.[0] || contextUser?.custodyAddress || '0x1234567890abcdef1234567890abcdef12345678',
        bio: contextUser?.bio,
        followerCount: contextUser?.followerCount,
        followingCount: contextUser?.followingCount,
      };

      console.log('🔍 Context user data:', contextUser);
      console.log('🔍 Processed farcaster user:', farcasterUser);

      console.log('✅ Farcaster user created - ok:', farcasterUser);
      setUser(farcasterUser);
      
      // Log successful connection to backend
      console.log('🚀🚀🚀 ABOUT TO CALL BACKEND API - START');
      try {
        console.log('🚀 Attempting to log user connection to backend...');
        const logResult = await logUserConnection({
          fid: farcasterUser.fid,
          username: farcasterUser.username,
          displayName: farcasterUser.displayName,
          walletAddress: farcasterUser.connectedAddress,
          connectionType: 'farcaster_auth'
        });
        console.log('📊 Backend logging result:', logResult ? 'Success' : 'Failed');
      } catch (logError) {
        console.error('❌ Failed to log user connection to backend:', logError);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      console.error('❌ Farcaster authentication error:', err);
      
      // Always use fallback for now
      console.warn('🔄 Using fallback user data');
      const fallbackUser = {
        fid: 123456,
        username: 'coffeeluver',
        displayName: 'Coffee Lover',
        pfpUrl: '/placeholder.svg',
        custodyAddress: '0x1234567890abcdef1234567890abcdef12345678',
        connectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
      };
      
      setUser(fallbackUser);
      
      // Log demo user connection to backend
      try {
        await logUserConnection({
          fid: fallbackUser.fid,
          walletAddress: fallbackUser.connectedAddress,
          username: fallbackUser.username,
          displayName: fallbackUser.displayName,
          connectionType: 'demo'
        });
        console.log('📊 Demo user logged to backend');
      } catch (logError) {
        console.error('❌ Failed to log demo user to backend:', logError);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setError(null);
  };

  useEffect(() => {
    // Auto-authenticate when component mounts
    signIn();
  }, []);

  const isAuthenticated = !!user;

  const value: FarcasterContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    signIn,
    signOut,
  };

  return (
    <FarcasterContext.Provider value={value}>
      {children}
    </FarcasterContext.Provider>
  );
}