/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string;
  // Add other custom VITE_* variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}/// <reference types="vite/client" />
