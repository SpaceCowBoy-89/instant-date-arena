// Platform-specific configuration for cross-platform moderation

export interface PlatformConfig {
  modelPaths: {
    textModel: string;
    imageModel: string;
    metadata: string;
  };
  executionProviders: string[];
  maxImageSize: number;
  compressionQuality: number;
  timeoutMs: number;
  batchSize: number;
}

export const platformConfigs: Record<string, PlatformConfig> = {
  web: {
    modelPaths: {
      textModel: '/assets/models/MiniLM-L6-v2/minilm_onnx/model.onnx',
      imageModel: '/assets/models/image-moderation/image_moderation_model_quantized.onnx',
      metadata: '/assets/models/image-moderation/model_metadata.json'
    },
    executionProviders: ['webgl', 'wasm'],
    maxImageSize: 1024,
    compressionQuality: 0.85,
    timeoutMs: 30000,
    batchSize: 4
  },
  
  ios: {
    modelPaths: {
      textModel: 'Bundle://models/MiniLM-L6-v2/minilm_onnx/model.onnx',
      imageModel: 'Bundle://models/image-moderation/image_moderation_model_quantized.onnx',
      metadata: 'Bundle://models/image-moderation/model_metadata.json'
    },
    executionProviders: ['coreml', 'cpu'],
    maxImageSize: 2048,
    compressionQuality: 0.8,
    timeoutMs: 45000,
    batchSize: 2
  },
  
  android: {
    modelPaths: {
      textModel: 'android_asset://models/MiniLM-L6-v2/minilm_onnx/model.onnx',
      imageModel: 'android_asset://models/image-moderation/image_moderation_model_quantized.onnx',
      metadata: 'android_asset://models/image-moderation/model_metadata.json'
    },
    executionProviders: ['nnapi', 'cpu'],
    maxImageSize: 2048,
    compressionQuality: 0.8,
    timeoutMs: 45000,
    batchSize: 2
  },
  
  capacitor: {
    modelPaths: {
      textModel: 'public/assets/models/MiniLM-L6-v2/minilm_onnx/model.onnx',
      imageModel: 'public/assets/models/image-moderation/image_moderation_model_quantized.onnx',
      metadata: 'public/assets/models/image-moderation/model_metadata.json'
    },
    executionProviders: ['cpu'],
    maxImageSize: 1536,
    compressionQuality: 0.8,
    timeoutMs: 60000,
    batchSize: 3
  },
  
  'react-native': {
    modelPaths: {
      textModel: 'models/MiniLM-L6-v2/minilm_onnx/model.onnx',
      imageModel: 'models/image-moderation/image_moderation_model_quantized.onnx',
      metadata: 'models/image-moderation/model_metadata.json'
    },
    executionProviders: ['cpu'],
    maxImageSize: 1536,
    compressionQuality: 0.75,
    timeoutMs: 60000,
    batchSize: 2
  }
};

export const performanceSettings = {
  // Memory management
  maxConcurrentInferences: {
    web: 4,
    ios: 2,
    android: 2,
    capacitor: 2,
    'react-native': 2
  },
  
  // Model warming (pre-load models)
  enableModelWarming: {
    web: true,
    ios: true,
    android: true,
    capacitor: true,
    'react-native': false
  },
  
  // Caching strategies
  enableResultCaching: {
    web: true,
    ios: true,
    android: true,
    capacitor: true,
    'react-native': true
  },
  
  cacheSize: {
    web: 100,
    ios: 50,
    android: 50,
    capacitor: 30,
    'react-native': 30
  },
  
  // Quality vs Performance trade-offs
  qualityPresets: {
    high: {
      confidenceThreshold: 0.9,
      useEnsembling: true,
      preprocessingQuality: 'high'
    },
    balanced: {
      confidenceThreshold: 0.8,
      useEnsembling: false,
      preprocessingQuality: 'medium'
    },
    fast: {
      confidenceThreshold: 0.7,
      useEnsembling: false,
      preprocessingQuality: 'low'
    }
  }
};

export const securitySettings = {
  // Input validation
  maxTextLength: 10000,
  maxImageSizeMB: 10,
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Output sanitization
  sanitizeErrorMessages: true,
  logSensitiveData: false,
  
  // Rate limiting (requests per minute per user)
  rateLimits: {
    textModeration: 100,
    imageModeration: 20,
    batchModeration: 5
  },
  
  // Content policy strictness
  policyStrictness: {
    production: 'strict',
    staging: 'balanced',
    development: 'permissive'
  }
};

/**
 * Get platform-specific configuration
 */
export function getPlatformConfig(): PlatformConfig {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    if ((window as any).Capacitor.getPlatform() === 'ios') {
      return platformConfigs.ios;
    } else if ((window as any).Capacitor.getPlatform() === 'android') {
      return platformConfigs.android;
    }
    return platformConfigs.capacitor;
  }
  
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return platformConfigs['react-native'];
  }
  
  return platformConfigs.web;
}

/**
 * Get performance settings for current platform
 */
export function getPerformanceSettings() {
  const platform = getCurrentPlatform();
  
  return {
    maxConcurrentInferences: performanceSettings.maxConcurrentInferences[platform] || 2,
    enableModelWarming: performanceSettings.enableModelWarming[platform] || false,
    enableResultCaching: performanceSettings.enableResultCaching[platform] || true,
    cacheSize: performanceSettings.cacheSize[platform] || 30
  };
}

/**
 * Get security settings
 */
export function getSecuritySettings() {
  const env = import.meta.env.MODE || 'development';
  const strictness = securitySettings.policyStrictness[env as keyof typeof securitySettings.policyStrictness] || 'balanced';
  
  return {
    ...securitySettings,
    currentStrictness: strictness
  };
}

/**
 * Detect current platform
 */
export function getCurrentPlatform(): string {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === 'ios' || platform === 'android') {
      return platform;
    }
    return 'capacitor';
  }
  
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'react-native';
  }
  
  return 'web';
}

/**
 * Check if platform supports native acceleration
 */
export function supportsNativeAcceleration(): boolean {
  const platform = getCurrentPlatform();
  return platform === 'ios' || platform === 'android';
}

/**
 * Get optimal execution providers for current platform
 */
export function getOptimalExecutionProviders(): string[] {
  const config = getPlatformConfig();
  return config.executionProviders;
}

/**
 * Validate platform requirements
 */
export function validatePlatformRequirements(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const platform = getCurrentPlatform();
  
  // Check ONNX Runtime availability
  if (platform === 'web') {
    if (typeof window === 'undefined' || !window.WebAssembly) {
      issues.push('WebAssembly not supported');
    }
  }
  
  // Check native module availability
  if (platform === 'ios' || platform === 'android') {
    if (typeof window === 'undefined' || !(window as any).Capacitor) {
      issues.push('Capacitor not available');
    }
  }
  
  // Check minimum requirements
  if (typeof Float32Array === 'undefined') {
    issues.push('Typed arrays not supported');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}