import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider, createConfig } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';
import { http } from 'viem';

const queryClient = new QueryClient();

// Use Base testnet for development, mainnet for production
const chain = process.env.NODE_ENV === 'development' ? baseSepolia : base;

// Create Wagmi config for OnchainKit
const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});

interface Web3ProviderProps {
  children: ReactNode;
}

// Enhanced provider with OnchainKit and Wagmi for Base network integration
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={chain}
          apiKey={process.env.VITE_CDP_API_KEY}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}