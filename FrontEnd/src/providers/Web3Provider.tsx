import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider, createConfig } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';
import { http } from 'viem';
import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient();

// Use Base testnet for development, mainnet for production
const chain = import.meta.env.MODE === 'development' ? baseSepolia : base;

// Create Wagmi config with Base network support
const config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected(), // Works with Farcaster's embedded wallet
  ],
  transports: {
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org'),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'),
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
          apiKey={import.meta.env.VITE_ONCHAINKIT_API_KEY}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}