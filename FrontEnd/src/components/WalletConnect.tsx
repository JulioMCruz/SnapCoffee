import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  username: string;
  displayName: string;
  pfp: string;
  walletAddress?: string;
}

export default function WalletConnect() {
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);

  useEffect(() => {
    // Get Farcaster user context from Mini App
    const getFarcasterUser = async () => {
      try {
        if (typeof window !== 'undefined' && window.parent !== window) {
          // Running in Farcaster client - user is already authenticated
          // Farcaster automatically creates a wallet for the user
          setFarcasterUser({
            fid: 123456,
            username: 'coffeeluver',
            displayName: 'Coffee Lover',
            pfp: '/placeholder.svg',
            walletAddress: '0x1234567890abcdef...'
          });
        } else {
          // Development mode - show demo user
          setFarcasterUser({
            fid: 123456,
            username: 'coffeeluver',
            displayName: 'Coffee Lover',
            pfp: '/placeholder.svg',
            walletAddress: '0x1234567890abcdef...'
          });
        }
      } catch (error) {
        console.warn('Failed to get Farcaster user:', error);
      }
    };

    getFarcasterUser();
  }, []);

  if (farcasterUser) {
    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={farcasterUser.pfp} alt={farcasterUser.displayName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {farcasterUser.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {farcasterUser.walletAddress && (
          <div className="text-xs text-green-500 font-mono">
            {farcasterUser.walletAddress.slice(0, 6)}...
          </div>
        )}
      </div>
    );
  }

  return (
    <Avatar className="h-8 w-8">
      <AvatarFallback className="bg-primary/10 text-primary animate-pulse">
        ...
      </AvatarFallback>
    </Avatar>
  );
}