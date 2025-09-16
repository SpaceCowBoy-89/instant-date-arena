import { registerPlugin } from '@capacitor/core';

export interface ChatbotNativePlugin {
  initialize(options: { modelPath: string }): Promise<{ success: boolean }>;
  generate(options: { prompt: string; maxTokens?: number }): Promise<{ response: string }>;
  getModelStatus(): Promise<{ loaded: boolean; modelSize: number }>;
  cleanup(): Promise<void>;
}

const ChatbotNative = registerPlugin<ChatbotNativePlugin>('ChatbotNative', {
  web: {
    initialize: async () => ({ success: false }),
    generate: async (options) => ({ 
      response: `Mock web response for: ${options.prompt}` 
    }),
    getModelStatus: async () => ({ loaded: false, modelSize: 0 }),
    cleanup: async () => {},
  }
});

export { ChatbotNative };