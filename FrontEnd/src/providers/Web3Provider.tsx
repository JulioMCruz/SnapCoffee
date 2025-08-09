import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

// Simplified provider for Farcaster Mini App
// Farcaster handles wallet creation automatically
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}