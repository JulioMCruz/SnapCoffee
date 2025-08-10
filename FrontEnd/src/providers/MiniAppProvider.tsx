import { ReactNode } from 'react';
import { SdkInitializer } from '@/components/SdkInitializer';
import { FarcasterProvider } from '@/contexts/FarcasterContext';

interface MiniAppProviderProps {
  children: ReactNode;
}

export function MiniAppProvider({ children }: MiniAppProviderProps) {
  return (
    <FarcasterProvider>
      <SdkInitializer />
      {children}
    </FarcasterProvider>
  );
}