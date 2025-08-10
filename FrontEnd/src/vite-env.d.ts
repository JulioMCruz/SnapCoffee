/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CDP_API_KEY?: string
  readonly VITE_ONCHAINKIT_API_KEY?: string
  readonly VITE_BASE_RPC_URL?: string
  readonly VITE_BASE_SEPOLIA_RPC_URL?: string
  readonly VITE_FARCASTER_HUB_URL?: string
  readonly VITE_NEYNAR_API_KEY?: string
  readonly VITE_APP_URL?: string
  readonly VITE_HMR_HOST?: string
  readonly VITE_HMR_PORT?: string
  readonly VITE_HMR_PROTOCOL?: string
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
