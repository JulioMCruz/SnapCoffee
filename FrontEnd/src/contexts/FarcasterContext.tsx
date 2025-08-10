import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

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
      
      // Get the context which contains user information
      const context = await sdk.context;
      console.log('📱 SDK context:', context);
      
      if (!context?.user && !context?.client) {
        throw new Error('No user context available from SDK');
      }

      // Create user from available context
      const farcasterUser: FarcasterUser = {
        fid: context.user?.fid || context.client?.clientFid || 123456,
        username: context.user?.username || 'coffeeluver',
        displayName: context.user?.displayName || context.user?.username || 'Coffee Lover',
        pfpUrl: context.user?.pfpUrl || '/placeholder.svg',
        custodyAddress: context.user?.custodyAddress || '0x1234567890abcdef1234567890abcdef12345678',
        connectedAddress: context.user?.verifications?.[0] || context.user?.custodyAddress || '0x1234567890abcdef1234567890abcdef12345678',
        bio: context.user?.bio,
        followerCount: context.user?.followerCount,
        followingCount: context.user?.followingCount,
      };

      console.log('✅ Farcaster user created:', farcasterUser);
      setUser(farcasterUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      console.error('❌ Farcaster authentication error:', err);
      
      // Always use fallback for now
      console.warn('🔄 Using fallback user data');
      setUser({
        fid: 123456,
        username: 'coffeeluver',
        displayName: 'Coffee Lover',
        pfpUrl: '/placeholder.svg',
        custodyAddress: '0x1234567890abcdef1234567890abcdef12345678',
        connectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
      });
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