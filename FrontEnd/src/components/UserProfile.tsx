import { useFarcaster } from "@/contexts/FarcasterContext";
import { 
  Avatar, 
  Name,
  Identity,
  Address
} from '@coinbase/onchainkit/identity';

export default function UserProfile() {
  const { user, loading: farcasterLoading, error } = useFarcaster();

  if (farcasterLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 bg-gray-200 animate-pulse rounded-full"></div>
        <div className="flex flex-col">
          <div className="h-3 w-16 bg-gray-200 animate-pulse rounded"></div>
          <div className="h-2 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
        </div>
      </div>
    );
  }

  if (error && process.env.NODE_ENV !== 'development') {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <div className="h-8 w-8 bg-red-50 rounded-full flex items-center justify-center">
          <span className="text-red-500 text-xs">!</span>
        </div>
        <span className="text-xs">Auth Error</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
        <span className="text-primary text-xs">?</span>
      </div>
    );
  }

  // Use connected address for onchain identity, fallback to custody address
  const address = (user.connectedAddress || user.custodyAddress) as `0x${string}`;

  return (
    <div className="flex items-center gap-2">
      <Identity address={address}>
        <Avatar className="h-8 w-8" />
        <div className="flex flex-col items-start min-w-0">
          <Name className="text-sm font-medium truncate max-w-24" />
          <Address className="text-xs text-green-500 font-mono" />
        </div>
      </Identity>
    </div>
  );
}