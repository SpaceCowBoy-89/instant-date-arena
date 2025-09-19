import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.speedheart.app',
  appName: 'SpeedHeart',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['photos']
    },
    ModerationModule: {
      // Custom plugin configuration
      modelPath: {
        ios: 'Bundle://models/',
        android: 'android_asset://models/'
      },
      useNativeAcceleration: true,
      enableCoreML: true, // iOS only
      enableNNAPI: true,  // Android only
      maxImageSize: 2048,
      compressionQuality: 0.8
    },
    CompatibilityPlugin: {
      // Cross-platform compatibility prediction
      modelPath: {
        ios: 'Bundle://CompatibilityModel.mlmodel',
        android: 'android_asset://compatibility_model.tflite'
      },
      enableCoreML: true,    // iOS CoreML acceleration
      enableNNAPI: true,     // Android NNAPI acceleration  
      enableGPU: true,       // GPU acceleration when available
      algorithmicFallback: true, // Enable fallback to algorithmic prediction
      featureNames: [
        'Adventure', 'Anime', 'Creative', 'Fantasy', 'Tech',
        'agreeableness', 'conscientiousness', 'extraversion', 
        'neuroticism', 'openness', 'same_location'
      ]
    }
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'App',
    backgroundColor: '#ffffff'
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'
  }
};

export default config;