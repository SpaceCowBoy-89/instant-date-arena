/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_PROJECT_ID: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Capacitor types for native app detection
interface Window {
  Capacitor?: {
    isNativePlatform(): boolean;
    getPlatform(): 'ios' | 'android' | 'web';
  };
}
