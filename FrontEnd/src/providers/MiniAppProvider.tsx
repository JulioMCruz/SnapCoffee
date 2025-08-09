import { ReactNode } from 'react';
import { SdkInitializer } from '@/components/SdkInitializer';

interface MiniAppProviderProps {
  children: ReactNode;
}

export function MiniAppProvider({ children }: MiniAppProviderProps) {
  return (
    <>
      <SdkInitializer />
      {children}
    </>
  );
}