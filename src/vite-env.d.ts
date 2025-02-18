/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOSTR_RELAYS: string
  readonly VITE_DEFAULT_NETWORK: string
  readonly VITE_CACHE_DURATION: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}