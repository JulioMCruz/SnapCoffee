import { useFarcaster } from "@/contexts/FarcasterContext";

export default function UserProfileSimple() {
  const { user, loading: farcasterLoading, error } = useFarcaster();

  console.log('🎭 UserProfile render:', { user, farcasterLoading, error });
  
  // Add a visible element to debug rendering
  if (process.env.NODE_ENV === 'development') {
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

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
        {user.pfpUrl && user.pfpUrl !== '/placeholder.svg' ? (
          <img 
            src={user.pfpUrl} 
            alt={user.displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `<span class="text-primary text-xs">${fallbackInitials}</span>`;
              }
            }}
          />
        ) : (
          <span className="text-primary text-xs">{fallbackInitials}</span>
        )}
      </div>
      
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-medium truncate max-w-24">
          {user.username}
        </span>
        <div className="text-xs text-green-500 font-mono">
          {user.connectedAddress?.slice(0, 6)}...
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-blue-500">DEBUG: Profile loaded</div>
        )}
      </div>
    </div>
  );
}