// Farcaster Mini App SDK utilities
import { sdk } from '@farcaster/miniapp-sdk';

let readyCalled = false;

export async function initializeFarcaster() {
  if (readyCalled) {
    console.log('Ready already called, skipping...');
    return;
  }

  try {
    console.log('Initializing Farcaster SDK...');
    console.log('SDK object:', sdk);
    console.log('SDK actions:', sdk?.actions);
    
    if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
      console.log('Calling sdk.actions.ready()...');
      await sdk.actions.ready();
      readyCalled = true;
      console.log('✅ sdk.actions.ready() completed successfully');
    } else {
      console.error('❌ SDK or ready function not available:', {
        sdk: !!sdk,
        actions: !!sdk?.actions,
        ready: typeof sdk?.actions?.ready
      });
    }
  } catch (error) {
    console.error('❌ Failed to call sdk.actions.ready():', error);
    throw error;
  }
}

// Call ready immediately when this module loads
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-initializing Farcaster on module load...');
  initializeFarcaster().catch(console.error);
}