import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.speedheart.app',
  appName: 'instant-date-arena',
  webDir: 'dist',
  server: {
    url: 'https://9f4b286a-b454-4612-822d-86b3877b8d7d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'automatic',
    path: 'ios'
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
  },
  plugins: {
    Camera: {
      permissions: {
        camera: 'This app uses the camera to take profile photos for your dating profile.'
      }
    }
  }
};

export default config;