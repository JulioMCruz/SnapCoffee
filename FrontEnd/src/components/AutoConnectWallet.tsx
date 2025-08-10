import { useEffect, useState } from 'react';
import { useAccount, useConnect } from 'wagmi';

export default function AutoConnectWallet() {
  const { isConnected, address, status } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    console.log('🔍 AutoConnectWallet status:', {
      isConnected,
      address,
      status,
      isPending,
      connectorsLength: connectors.length,
      connectorNames: connectors.map(c => c.name),
      hasAttempted,
      error: error?.message
    });

    // Find Farcaster connector specifically
    const farcasterConnector = connectors.find(c => 
      c.name.toLowerCase().includes('farcaster') || 
      c.name.toLowerCase().includes('miniapp')
    );

    // Auto-connect when component mounts if not already connected
    if (!isConnected && !isPending && !hasAttempted && farcasterConnector) {
      console.log('🔗 Auto-connecting to Farcaster wallet for Base network...', farcasterConnector.name);
      setHasAttempted(true);
      connect({ connector: farcasterConnector });
    } else if (!isConnected && !isPending && !hasAttempted && connectors.length > 0) {
      console.log('🔗 Fallback: connecting to first available connector...', connectors[0].name);
      setHasAttempted(true);
      connect({ connector: connectors[0] });
    }
  }, [isConnected, isPending, connectors, connect, hasAttempted, status, address, error]);

  useEffect(() => {
    // Log connection status for debugging
    if (isConnected && address) {
      console.log('✅ Successfully connected to Base network:', address);
    }
    
    // Log errors
    if (error) {
      console.error('❌ Wallet connection error:', error);
    }
  }, [isConnected, address, error]);

  // This component doesn't render anything
  return null;
}