import { useFarcaster } from "@/contexts/FarcasterContext";
import { useAccount, useConnect } from 'wagmi';

export default function UserProfileSimple() {
  const { user, loading: farcasterLoading, error } = useFarcaster();
  const { isConnected, address: connectedWalletAddress } = useAccount();
  const { connect, connectors } = useConnect();

  console.log('🎭 UserProfile render:', { 
    user, 
    farcasterLoading, 
    error,
    userExists: !!user,
    pfpUrl: user?.pfpUrl,
    username: user?.username,
    displayName: user?.displayName,
    hasValidPfp: user?.pfpUrl && user?.pfpUrl !== '/placeholder.svg',
    // Wagmi wallet connection data
    isWalletConnected: isConnected,
    connectedWalletAddress,
    availableConnectors: connectors?.map(c => c.name)
  });
  
  // Add a visible element to debug rendering
  if (import.meta.env.MODE === 'development') {
    console.log('🔍 Debug: UserProfile component is rendering');
  }

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

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <div className="h-8 w-8 bg-red-50 rounded-full flex items-center justify-center">
          <span className="text-red-500 text-xs">!</span>
        </div>
        <span className="text-xs">Error</span>
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

  const fallbackInitials = user.displayName
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get the current wallet address (connected or fallback)
  const currentAddress = isConnected && connectedWalletAddress ? connectedWalletAddress : user.connectedAddress;
  
  // Format address: first 5 + last 5 characters
  const formatAddress = (address: string) => {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  return (
    <div className="flex items-center justify-between w-full max-w-40 gap-3">
      {/* Left Column: Display Name + Address */}
      <div className="flex flex-col items-end text-right min-w-0 flex-1 space-y-0.5">
        {/* Display Name */}
        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-none max-w-full truncate">
          {user.displayName || user.username}
        </div>
        
        {/* Address (only if exists) */}
        {currentAddress && (
          <div className="text-xs font-mono leading-none">
            {isConnected && connectedWalletAddress ? (
              <span className="text-green-600 font-medium">
                {formatAddress(connectedWalletAddress)}
              </span>
            ) : (
              <span className="text-orange-500">
                {formatAddress(user.connectedAddress || '')}
              </span>
            )}
          </div>
        )}
        
        {/* Development: Connect button if needed */}
        {import.meta.env.MODE === 'development' && !isConnected && connectors.length > 0 && (
          <button 
            onClick={() => connect({ connector: connectors[0] })}
            className="text-xs text-blue-500 underline hover:text-blue-700"
          >
            Connect
          </button>
        )}
      </div>
      
      {/* Right Column: Profile Picture */}
      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
        {user.pfpUrl && user.pfpUrl !== '/placeholder.svg' ? (
          <img 
            src={user.pfpUrl} 
            alt={user.displayName}
            className="w-full h-full object-cover"
            onLoad={() => console.log('✅ Profile image loaded successfully:', user.pfpUrl)}
            onError={(e) => {
              console.error('❌ Profile image failed to load:', user.pfpUrl);
              const target = e.target as HTMLElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-primary text-xs">${fallbackInitials}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-primary text-xs font-medium">{fallbackInitials}</span>
        )}
      </div>
    </div>
  );
}