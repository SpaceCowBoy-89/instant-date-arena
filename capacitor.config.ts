import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9f4b286ab4544612822d86b3877b8d7d',
  appName: 'instant-date-arena',
  webDir: 'dist',
  server: {
    url: 'https://9f4b286a-b454-4612-822d-86b3877b8d7d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK'
    }
  }
};

export default config;