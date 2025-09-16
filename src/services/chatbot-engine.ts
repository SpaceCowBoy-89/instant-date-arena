import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { initMLCEngine } from '../utils/mlcEngine';
import { ChatbotNative } from './chatbot-native-plugin';

const platform = {
  isWeb: !Capacitor.isNativePlatform(),
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
  isNative: Capacitor.isNativePlatform()
};

export interface ChatContext {
  userId: string;
  currentPage: string;
  onboardingStage: 'new' | 'profile_setup' | 'quiz_taken' | 'test_completed' | 'active_user';
  profileCompleteness: number;
  conversationHistory: ChatMessage[];
  userPreferences: {
    responseLength: 'short' | 'medium' | 'long';
    personality: 'professional' | 'casual' | 'flirty';
    topics: string[];
  };
  lastInteraction: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  source?: 'rule-based' | 'retrieval' | 'ai-generated';
  confidence?: number;
  metadata?: {
    responseTime: number;
    modelUsed: string;
  };
}

export interface ChatResponse {
  content: string;
  confidence: number;
  source: 'rule-based' | 'retrieval' | 'ai-generated';
  suggestions?: string[];
  metadata: {
    responseTime: number;
    modelUsed: string;
    tokensGenerated?: number;
  };
}

export class EnhancedChatbotEngine {
  private isInitialized = false;
  private webEngine: any = null;
  private nativeEngine: any = null;
  
  constructor() {
    // Empty constructor
  }

  async initialize(): Promise<boolean> {
    console.log('Initializing chatbot engine...');
    try {
      if (platform.isWeb) {
        console.log('Initializing MLC-AI Web LLM for web platform');
        // Initialize MLC-AI Web LLM for web platforms
        this.webEngine = await initMLCEngine();
        console.log('Web AI engine initialized successfully');
      } else if (platform.isNative) {
        console.log('Initializing native llama engine for mobile');
        // Initialize native llama engine for mobile
        const result = await ChatbotNative.initialize({ 
          modelPath: platform.isIOS ? 'Bundle://models/' : 'android_asset://models/' 
        });
        if (result.success) {
          this.nativeEngine = ChatbotNative;
          console.log('Native AI engine initialized successfully');
        } else {
          console.error('Native engine initialization failed');
        }
      }
      
      this.isInitialized = true;
      console.log('Chatbot engine initialization completed successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AI engine:', error);
      this.isInitialized = false;
      return false;
    }
  }

  async generateResponse(input: string, context: ChatContext): Promise<ChatResponse> {
    const startTime = performance.now();
    
    console.log('Generating response for input:', input);
    console.log('Engine initialized:', this.isInitialized);
    console.log('Web engine available:', !!this.webEngine);
    console.log('Native engine available:', !!this.nativeEngine);
    
    if (!this.isInitialized) {
      console.log('Engine not initialized, using fallback');
      return this.getFallbackResponse(input, startTime);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const prompt = `${systemPrompt}\n\nUser: ${input}\nCaptain Corazón:`;

      let response: string;
      let modelUsed: string;

      if (platform.isWeb && this.webEngine) {
        console.log('Using MLC-AI Web LLM');
        // Use MLC-AI Web LLM
        const completion = await this.webEngine.chat.completions.create({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input }
          ],
          max_tokens: 150,
          temperature: 0.7,
        });
        response = completion.choices[0].message.content;
        modelUsed = 'gemma-2-2b-it-MLC';
        console.log('AI response generated:', response);
      } else if (platform.isNative && this.nativeEngine) {
        console.log('Using native llama engine');
        // Use native llama engine
        const result = await this.nativeEngine.generate({ 
          prompt, 
          maxTokens: 150 
        });
        response = result.response;
        modelUsed = 'llama-native';
        console.log('Native AI response generated:', response);
      } else {
        console.log('No engine available, using fallback');
        return this.getFallbackResponse(input, startTime);
      }

      return {
        content: response.trim(),
        confidence: 0.9,
        source: 'ai-generated',
        metadata: {
          responseTime: performance.now() - startTime,
          modelUsed,
          tokensGenerated: response.split(' ').length
        }
      };
    } catch (error) {
      console.error('AI generation failed:', error);
      return this.getFallbackResponse(input, startTime);
    }
  }

  private buildSystemPrompt(context: ChatContext): string {
    return `You are Captain Corazón, a warm and helpful dating assistant for SpeedHeart app. You help users with:
- Finding and joining communities based on interests
- Dating advice and tips
- Profile optimization
- Understanding compatibility

Current context:
- Page: ${context.currentPage}
- Onboarding stage: ${context.onboardingStage}
- Profile completeness: ${context.profileCompleteness}%

Be friendly, encouraging, and concise. Use emojis sparingly. Keep responses under 100 words.`;
  }

  private getFallbackResponse(input: string, startTime: number): ChatResponse {
    const fallbackResponses = [
      "Hi there! I'm Captain Corazón, your dating assistant! 💕 How can I help you today?",
      "I'm here to help you navigate your dating journey! What would you like to know?",
      "Let's make some connections! What can I assist you with?",
      "I'm always here to help with dating tips and community recommendations!",
      "Tell me more about what you're looking for, and I'll do my best to help!"
    ];
    
    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    return {
      content: response,
      confidence: 0.6,
      source: 'rule-based',
      metadata: {
        responseTime: performance.now() - startTime,
        modelUsed: 'fallback-rules'
      }
    };
  }

  async saveConversation(context: ChatContext, messages: ChatMessage[]): Promise<void> {
    try {
      const conversationData = {
        userId: context.userId,
        messages: messages.slice(-20),
        context: {
          page: context.currentPage,
          stage: context.onboardingStage,
          timestamp: Date.now()
        }
      };

      await Preferences.set({
        key: `conversation_${context.userId}`,
        value: JSON.stringify(conversationData)
      });
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  async loadConversation(userId: string): Promise<ChatMessage[]> {
    try {
      const { value } = await Preferences.get({ key: `conversation_${userId}` });
      if (value) {
        const data = JSON.parse(value);
        return data.messages || [];
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
    return [];
  }

  getHealthStatus(): any {
    return {
      initialized: this.isInitialized,
      platform: platform,
      engines: {
        web: !!this.webEngine,
        native: !!this.nativeEngine,
        rules: true,
        retrieval: false
      }
    };
  }
}

// Stub classes to satisfy imports
export class RuleBasedEngine {
  async initialize() { return true; }
  async tryRespond(input: string, context: ChatContext) {
    return {
      content: "I'm here to help!",
      confidence: 0.6,
      source: 'rule-based' as const
    };
  }
}

export class RetrievalEngine {
  async initialize() { return true; }
  async findMatch(input: string, context: ChatContext) {
    return {
      content: "Let me help you with that!",
      confidence: 0.5,
      source: 'retrieval' as const
    };
  }
}

export class CaptainCorazonPersonality {
  buildPrompt(input: string, context: ChatContext): string {
    return `As Captain Corazon, a friendly dating assistant, respond to: ${input}`;
  }
  
  postProcess(response: string): string {
    return response + " 💕";
  }
}

// Export singleton instance
export const chatbotEngine = new EnhancedChatbotEngine();