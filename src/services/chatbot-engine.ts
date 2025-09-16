// Enhanced cross-platform chatbot engine
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Platform detection
const platform = {
  isWeb: !Capacitor.isNativePlatform(),
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
  isNative: Capacitor.isNativePlatform()
};

// Model configurations for different device capabilities
export const modelConfigs = {
  instant: {
    name: "phi-1_5-q4f16_1-MLC",
    size_mb: 400,
    vram_required: 600,
    use_case: "quick_responses",
    max_tokens: 50,
    context_window: 1024
  },
  
  balanced: {
    name: "phi-2-q4f16_1-MLC", 
    size_mb: 800,
    vram_required: 1000,
    use_case: "general_chat",
    max_tokens: 100,
    context_window: 2048
  },
  
  premium: {
    name: "gemma-2-2b-it-q4f16_1-MLC",
    size_mb: 1200,
    vram_required: 1400,
    use_case: "complex_conversations",
    max_tokens: 150,
    context_window: 4096
  }
};

// Device capability detection
interface DeviceCapabilities {
  ram: number;
  gpu: boolean;
  webgl: boolean;
  storage: number;
  connection: 'slow' | 'fast' | 'offline';
}

async function detectDeviceCapabilities(): Promise<DeviceCapabilities> {
  const capabilities: DeviceCapabilities = {
    ram: 4000, // Default assumption
    gpu: false,
    webgl: false,
    storage: 1000,
    connection: navigator.onLine ? 'fast' : 'offline'
  };

  if (platform.isWeb) {
    // Web-specific detection
    capabilities.webgl = !!document.createElement('canvas').getContext('webgl2');
    capabilities.gpu = capabilities.webgl;
    
    // Estimate RAM from performance
    if ('memory' in performance) {
      capabilities.ram = (performance as any).memory.jsHeapSizeLimit / 1024 / 1024;
    }
    
    // Storage estimation
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        capabilities.storage = (estimate.quota || 1000000000) / 1024 / 1024;
      } catch (error) {
        console.warn('Storage estimation failed:', error);
      }
    }
    
    // Connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      capabilities.connection = connection.effectiveType?.includes('4g') ? 'fast' : 'slow';
    }
  }

  return capabilities;
}

// Optimal model selection
function selectOptimalModel(capabilities: DeviceCapabilities) {
  if (capabilities.ram < 2000 || capabilities.connection === 'slow') {
    return modelConfigs.instant;
  }
  
  if (capabilities.ram < 6000 || !capabilities.gpu) {
    return modelConfigs.balanced;
  }
  
  return modelConfigs.premium;
}

// Chat context interface
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
    fallbackUsed: boolean;
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

// Enhanced chatbot engine with multi-tier responses
export class EnhancedChatbotEngine {
  private webEngine: any = null;
  private nativeEngine: any = null;
  private ruleEngine: RuleBasedEngine;
  private retrievalEngine: RetrievalEngine;
  private personality: CaptainCorazonPersonality;
  private currentModel: any = null;
  private capabilities: DeviceCapabilities | null = null;
  private isInitialized = false;
  
  constructor() {
    this.ruleEngine = new RuleBasedEngine();
    this.retrievalEngine = new RetrievalEngine();
    this.personality = new CaptainCorazonPersonality();
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Detect device capabilities
      this.capabilities = await detectDeviceCapabilities();
      console.log('Device capabilities:', this.capabilities);

      // Initialize appropriate engine
      if (platform.isWeb) {
        await this.initializeWebEngine();
      } else {
        await this.initializeNativeEngine();
      }

      // Initialize rule-based and retrieval engines
      await this.ruleEngine.initialize();
      await this.retrievalEngine.initialize();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Chatbot initialization failed:', error);
      return false;
    }
  }

  private async initializeWebEngine(): Promise<void> {
    try {
      // Dynamic import to avoid loading on mobile
      const webllm = await import('@mlc-ai/web-llm');
      
      const selectedModel = selectOptimalModel(this.capabilities!);
      console.log('Selected model:', selectedModel.name);

      // Progressive loading: start with instant model
      const instantConfig = this.buildWebConfig(modelConfigs.instant);
      this.webEngine = await webllm.CreateServiceWorkerMLCEngine(
        modelConfigs.instant.name, 
        {
          initProgressCallback: this.handleLoadingProgress,
          appConfig: instantConfig
        }
      );

      // Background load better models if device supports it
      if (selectedModel !== modelConfigs.instant) {
        this.backgroundLoadModel(selectedModel);
      }

    } catch (error) {
      console.error('Web engine initialization failed:', error);
      throw error;
    }
  }

  private async initializeNativeEngine(): Promise<void> {
    try {
      // Use proper Capacitor plugin instead of React Native
      const { ChatbotNative } = await import('./chatbot-native-plugin');
      this.nativeEngine = new ChatbotNative();
      
      const success = await this.nativeEngine.initialize();
      if (!success) {
        throw new Error('Native engine initialization failed');
      }
    } catch (error) {
      console.error('Native engine initialization failed:', error);
      // Fallback to rule-based only
      this.nativeEngine = null;
    }
  }

  private buildWebConfig(modelConfig: any) {
    return {
      model_list: [
        {
          model: `/models/${modelConfig.name}`,
          model_id: modelConfig.name,
          model_lib: `/models/${modelConfig.name.replace('-MLC', '-webgpu.wasm')}`,
          vram_required_MB: modelConfig.vram_required,
          low_resource_required: modelConfig === modelConfigs.instant,
          required_features: modelConfig === modelConfigs.instant ? [] : ["shader-f16"],
          overrides: { 
            context_window_size: modelConfig.context_window,
            max_gen_len: modelConfig.max_tokens
          }
        }
      ],
      useIndexedDBCache: true
    };
  }

  private async backgroundLoadModel(modelConfig: any): Promise<void> {
    setTimeout(async () => {
      try {
        console.log(`Background loading ${modelConfig.name}...`);
        const webllm = await import('@mlc-ai/web-llm');
        const config = this.buildWebConfig(modelConfig);
        
        const betterEngine = await webllm.CreateServiceWorkerMLCEngine(
          modelConfig.name,
          {
            initProgressCallback: (progress) => console.log(`Background: ${progress.text}`),
            appConfig: config
          }
        );
        
        // Switch to better model
        this.webEngine = betterEngine;
        this.currentModel = modelConfig;
        console.log(`Successfully upgraded to ${modelConfig.name}`);
        
      } catch (error) {
        console.warn(`Background model loading failed:`, error);
      }
    }, 5000); // Wait 5 seconds before background loading
  }

  private handleLoadingProgress = (progress: any) => {
    console.log(`Loading: ${progress.text}`);
    // Emit progress events for UI
    window.dispatchEvent(new CustomEvent('chatbot-loading-progress', { 
      detail: progress 
    }));
  };

  async generateResponse(input: string, context: ChatContext): Promise<ChatResponse> {
    const startTime = performance.now();
    const maxRetries = 3;
    let lastError: Error | null = null;

    try {
      // 1. Quick rule-based responses (0-10ms)
      const ruleResponse = await this.ruleEngine.tryRespond(input, context);
      if (ruleResponse.confidence > 0.85) {
        return {
          ...ruleResponse,
          source: 'rule-based',
          metadata: {
            responseTime: performance.now() - startTime,
            modelUsed: 'rule-engine'
          }
        };
      }

      // 2. Retrieval-based responses (10-100ms)
      const retrievalResponse = await this.retrievalEngine.findMatch(input, context);
      if (retrievalResponse.confidence > 0.75) {
        return {
          ...retrievalResponse,
          source: 'retrieval',
          metadata: {
            responseTime: performance.now() - startTime,
            modelUsed: 'retrieval-engine'
          }
        };
      }

      // 3. AI-generated responses with retry logic (500-3000ms)
      if (this.webEngine || this.nativeEngine) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const timeout = attempt * 5000; // 5s, 10s, 15s
            const aiResponse = await Promise.race([
              this.generateAIResponse(input, context),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Generation timeout')), timeout)
              )
            ]);
            
            return {
              ...aiResponse,
              source: `ai-generated-attempt-${attempt}` as any,
              metadata: {
                responseTime: performance.now() - startTime,
                modelUsed: this.currentModel?.name || 'native-model',
                tokensGenerated: aiResponse.metadata?.tokensGenerated
              }
            };
          } catch (error) {
            lastError = error as Error;
            console.warn(`AI generation attempt ${attempt} failed:`, error);
            
            if (attempt < maxRetries) {
              // Brief delay before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
      }

      // 4. Enhanced fallback with context awareness
      const fallbackResponse = this.ruleEngine.getContextualFallback(input, context);
      return {
        ...fallbackResponse,
        source: 'rule-based',
        metadata: {
          responseTime: performance.now() - startTime,
          modelUsed: 'fallback-rules',
          fallbackUsed: true
        }
      };

    } catch (error) {
      console.error('Complete response generation failed:', error);
      return this.getEmergencyResponse(context, lastError || error as Error, startTime);
    }
  }

  private async generateAIResponse(input: string, context: ChatContext): Promise<ChatResponse> {
    const prompt = this.personality.buildPrompt(input, context);
    
    try {
      let response: string;
      let tokensGenerated = 0;

      if (platform.isWeb && this.webEngine) {
        const result = await this.webEngine.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: this.currentModel?.max_tokens || 100,
          temperature: 0.7,
          top_p: 0.9
        });
        
        response = result.choices[0].message.content;
        tokensGenerated = result.usage?.completion_tokens || 0;
        
      } else if (platform.isNative && this.nativeEngine) {
        response = await this.nativeEngine.generate(prompt);
        tokensGenerated = response.split(' ').length; // Rough estimate
        
      } else {
        throw new Error('No AI engine available');
      }

      // Post-process response
      response = this.personality.postProcess(response);

      return {
        content: response,
        confidence: 0.9,
        source: 'ai-generated',
        suggestions: this.generateSuggestions(input, context),
        metadata: {
          responseTime: 0, // Will be set by caller
          modelUsed: this.currentModel?.name || 'native-model',
          tokensGenerated
        }
      };

    } catch (error) {
      console.error('AI generation failed:', error);
      throw error;
    }
  }

  private generateSuggestions(input: string, context: ChatContext): string[] {
    // Generate contextual suggestions based on current page and user journey
    const suggestions = [];
    
    if (context.currentPage === '/profile') {
      suggestions.push("Help me write a better bio", "Suggest profile photos", "What makes a great profile?");
    } else if (context.currentPage === '/matches') {
      suggestions.push("How to start a conversation?", "What's a good first message?", "Dating tips");
    } else if (context.currentPage === '/communities') {
      suggestions.push("Which community should I join?", "How to make friends?", "Community etiquette");
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  private getErrorResponse(error: any, startTime: number): ChatResponse {
    const errorResponses = [
      "Oops! I'm having a moment. Try asking me something else! 😊",
      "My circuits are a bit tangled right now. What else can I help with? 🤖",
      "Technical hiccup! But I'm still here to help however I can! 💪"
    ];

    return {
      content: errorResponses[Math.floor(Math.random() * errorResponses.length)],
      confidence: 0.5,
      source: 'rule-based',
      metadata: {
        responseTime: performance.now() - startTime,
        modelUsed: 'error-fallback',
        fallbackUsed: true
      }
    };
  }

  private getEmergencyResponse(context: ChatContext, error: Error, startTime: number): ChatResponse {
    const errorContext = error?.message?.toLowerCase() || '';
    
    let emergencyText: string;
    
    if (errorContext.includes('timeout')) {
      emergencyText = "Things are running a bit slow right now, but I'm still here! Try asking something simple. ⏳";
    } else if (errorContext.includes('network') || errorContext.includes('fetch')) {
      emergencyText = "Connection issues detected! Don't worry, I can still help with basic questions offline. 📶";
    } else if (context.currentPage.includes('communities')) {
      emergencyText = "Having some technical hiccups, but I can still help you explore communities! What interests you? 🌟";
    } else if (context.currentPage.includes('matches')) {
      emergencyText = "Technical difficulties, but love finds a way! Try browsing your matches or ask me for dating tips! 💖";
    } else if (context.currentPage.includes('profile')) {
      emergencyText = "System glitch, but your profile is still fabulous! Need any quick tips while I recover? ✨";
    } else {
      emergencyText = "I'm experiencing some technical issues, but I'm working on it! Try asking me something else in a moment. 😊";
    }
    
    return {
      content: emergencyText,
      confidence: 0.3,
      source: 'rule-based',
      metadata: {
        responseTime: performance.now() - startTime,
        modelUsed: 'emergency-fallback',
        fallbackUsed: true
      }
    };
  }

  // Conversation memory management
  async saveConversation(context: ChatContext, messages: ChatMessage[]): Promise<void> {
    try {
      const conversationData = {
        userId: context.userId,
        messages: messages.slice(-20), // Keep last 20 messages
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

      // Also collect training data
      await this.collectTrainingData(messages, context);
      
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  private async collectTrainingData(messages: ChatMessage[], context: ChatContext): Promise<void> {
    // Collect anonymized training data for fine-tuning
    if (messages.length < 2) return;

    const trainingExample = {
      conversation_context: {
        app_section: context.currentPage,
        user_journey_stage: context.onboardingStage,
        profile_completeness: context.profileCompleteness
      },
      messages: messages.slice(-4).map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 200), // Truncate for privacy
        source: msg.source
      })),
      timestamp: Date.now(),
      user_hash: this.hashUserId(context.userId) // Anonymize
    };

    // Store for later batch upload
    const existingData = await Preferences.get({ key: 'training_data_batch' });
    const batch = existingData.value ? JSON.parse(existingData.value) : [];
    batch.push(trainingExample);

    // Keep only last 100 examples
    if (batch.length > 100) {
      batch.splice(0, batch.length - 100);
    }

    await Preferences.set({
      key: 'training_data_batch',
      value: JSON.stringify(batch)
    });
  }

  private hashUserId(userId: string): string {
    // Simple hash for anonymization
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Health check and diagnostics
  async getEngineStatus(): Promise<{
    initialized: boolean;
    webEngine: boolean;
    nativeEngine: boolean;
    currentModel: string;
    capabilities: DeviceCapabilities | null;
    lastError?: string;
  }> {
    return {
      initialized: this.isInitialized,
      webEngine: !!this.webEngine,
      nativeEngine: !!this.nativeEngine,
      currentModel: this.currentModel?.name || 'none',
      capabilities: this.capabilities
    };
  }
}

// Rule-based response engine
class RuleBasedEngine {
  private rules: Map<string, (input: string, context: ChatContext) => ChatResponse | null> = new Map();

  async initialize(): Promise<void> {
    // Dating-specific quick responses
    this.rules.set('greeting', (input, context) => {
      const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
      if (greetings.some(g => input.toLowerCase().includes(g))) {
        return {
          content: `Hey there! 😊 ${this.getContextualGreeting(context)}`,
          confidence: 0.9,
          source: 'rule-based'
        };
      }
      return null;
    });

    this.rules.set('profile_help', (input, context) => {
      const profileKeywords = ['profile', 'bio', 'photo', 'picture', 'about me'];
      if (profileKeywords.some(k => input.toLowerCase().includes(k))) {
        return {
          content: this.getProfileAdvice(context),
          confidence: 0.85,
          source: 'rule-based'
        };
      }
      return null;
    });

    this.rules.set('conversation_starters', (input, context) => {
      const starterKeywords = ['conversation', 'first message', 'what to say', 'ice breaker'];
      if (starterKeywords.some(k => input.toLowerCase().includes(k))) {
        return {
          content: this.getConversationStarter(),
          confidence: 0.88,
          source: 'rule-based'
        };
      }
      return null;
    });
  }

  async tryRespond(input: string, context: ChatContext): Promise<ChatResponse> {
    for (const [_, rule] of this.rules) {
      const response = rule(input, context);
      if (response) {
        return response;
      }
    }

    return {
      content: '',
      confidence: 0,
      source: 'rule-based'
    };
  }

  private getContextualGreeting(context: ChatContext): string {
    if (context.currentPage === '/profile') {
      return "Working on your profile? I can help make it irresistible! 💫";
    } else if (context.currentPage === '/matches') {
      return "Ready to find your perfect match? Let's make some sparks fly! ✨";
    } else if (context.currentPage === '/communities') {
      return "Looking to join a fun community? I know all the best groups! 🎉";
    }
    return "What brings you to me today? I'm here to help with all things love! 💕";
  }

  private getProfileAdvice(context: ChatContext): string {
    if (context.profileCompleteness < 50) {
      return "Your profile needs some love! Add photos, write about your interests, and show your personality. Want specific tips? 📸✨";
    }
    return "Your profile's looking good! Want to make it even better? I can suggest ways to make it more engaging! 🌟";
  }

  private getConversationStarter(): string {
    const starters = [
      "Try asking about their favorite travel destination! 🌍",
      "Compliment something specific from their profile! 👀",
      "Ask about their weekend plans - keep it light and fun! 🎉",
      "Share a funny observation and ask for their take! 😄",
      "Ask about their favorite local spot - great for date ideas! 📍"
    ];
    return starters[Math.floor(Math.random() * starters.length)];
  }

  getContextualFallback(input: string, context: ChatContext): ChatResponse {
    const fallbacks = [
      "I'm still learning! Can you rephrase that? I'm great with dating advice! 💕",
      "Hmm, not sure about that one. Ask me about profiles, conversations, or dating tips! 😊",
      "That's interesting! I specialize in love and dating - what can I help you with there? 💖"
    ];

    return {
      content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
      confidence: 0.6,
      source: 'rule-based'
    };
  }
}

// Retrieval-based engine for FAQ and common questions
class RetrievalEngine {
  private knowledge: Map<string, ChatResponse> = new Map();

  async initialize(): Promise<void> {
    // Load pre-built knowledge base
    const knowledge = [
      {
        keywords: ['safe', 'safety', 'secure', 'privacy'],
        response: "Your safety is my top priority! SpeedHeart has photo verification, reporting tools, and privacy controls. Check out Safety Center for more! 🛡️",
        confidence: 0.9
      },
      {
        keywords: ['cost', 'price', 'premium', 'subscription'],
        response: "SpeedHeart is free to use! Premium features unlock extra matches and boosts. Want to know more about what's included? 💎",
        confidence: 0.85
      },
      {
        keywords: ['delete', 'account', 'remove'],
        response: "Sorry to see you go! You can delete your account in Settings > Account > Delete Account. Need help with anything else first? 🥺",
        confidence: 0.8
      }
    ];

    knowledge.forEach(item => {
      item.keywords.forEach(keyword => {
        this.knowledge.set(keyword, {
          content: item.response,
          confidence: item.confidence,
          source: 'retrieval'
        });
      });
    });
  }

  async findMatch(input: string, context: ChatContext): Promise<ChatResponse> {
    const inputLower = input.toLowerCase();
    
    for (const [keyword, response] of this.knowledge) {
      if (inputLower.includes(keyword)) {
        return response;
      }
    }

    return {
      content: '',
      confidence: 0,
      source: 'retrieval'
    };
  }
}

// Captain Corazón personality system
class CaptainCorazonPersonality {
  private personality = {
    traits: ['flirty', 'helpful', 'encouraging', 'playful', 'wise'],
    tone: 'warm_and_supportive',
    emoji_frequency: 'moderate',
    response_style: 'concise_but_complete'
  };

  buildPrompt(userInput: string, context: ChatContext): string {
    const systemPrompt = `You are Captain Corazón, the charming AI dating coach for SpeedHeart dating app.

PERSONALITY:
- Flirty but professional dating coach
- Warm, encouraging, and playful
- Expert in dating advice, conversation tips, profile optimization
- Use 1-2 relevant emojis per response
- Keep responses under 60 words unless explaining complex topics

CURRENT CONTEXT:
- User journey stage: ${context.onboardingStage}
- Current app section: ${context.currentPage}
- Profile completeness: ${context.profileCompleteness}%
- Recent conversation: ${context.conversationHistory.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')}

RESPONSE GUIDELINES:
- Be helpful and specific
- Reference their dating journey when relevant
- Offer actionable advice
- Stay positive and encouraging
- If unsure, ask clarifying questions

User message: "${userInput}"

Respond as Captain Corazón:`;

    return systemPrompt;
  }

  postProcess(response: string): string {
    // Clean up AI response
    response = response.trim();
    
    // Ensure reasonable length
    if (response.length > 300) {
      response = response.substring(0, 280) + '... 💫';
    }

    // Ensure emoji presence but not overuse
    const emojiCount = (response.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    
    if (emojiCount === 0) {
      response += ' 😊';
    } else if (emojiCount > 3) {
      // Remove excess emojis
      response = response.replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu, 
        (match, offset, string) => {
          const matches = string.substring(0, offset).match(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu) || [];
          return matches.length < 2 ? match : '';
        });
    }

    return response;
  }
}

// Compatibility class for existing Chatbot component
export class ChatbotEngine {
  private enhancedEngine: EnhancedChatbotEngine;
  
  constructor() {
    this.enhancedEngine = new EnhancedChatbotEngine();
  }
  
  async initialize(options?: {
    onProgress?: (progress: number) => void;
    onStatusChange?: (status: string) => void;
  }): Promise<boolean> {
    // Set up progress and status callbacks
    if (options?.onProgress) {
      window.addEventListener('chatbot-loading-progress', (event: any) => {
        const progress = Math.round((event.detail.progress || 0) * 100);
        options.onProgress!(progress);
      });
    }
    
    if (options?.onStatusChange) {
      // Simple status mapping
      options.onStatusChange('initializing');
      const success = await this.enhancedEngine.initialize();
      options.onStatusChange(success ? 'ready' : 'fallback');
      return success;
    }
    
    return await this.enhancedEngine.initialize();
  }
  
  async generateResponse(input: string, context: any): Promise<{ text: string; source?: string }> {
    // Convert context to expected format
    const chatContext: ChatContext = {
      userId: context.userId || 'anonymous',
      currentPage: context.currentPage || '/',
      onboardingStage: this.mapOnboardingStage(context.onboardingStage),
      profileCompleteness: context.profileCompleteness || 0,
      conversationHistory: (context.conversationHistory || []).map((msg: any) => ({
        id: msg.id?.toString() || Date.now().toString(),
        content: msg.text || msg.content || '',
        role: msg.isUser ? 'user' : 'assistant',
        timestamp: msg.timestamp || Date.now()
      })),
      userPreferences: {
        responseLength: 'medium',
        personality: 'casual',
        topics: []
      },
      lastInteraction: Date.now()
    };
    
    const response = await this.enhancedEngine.generateResponse(input, chatContext);
    return {
      text: response.content,
      source: response.source
    };
  }
  
  private mapOnboardingStage(stage: string): ChatContext['onboardingStage'] {
    switch (stage) {
      case 'new_user':
      case 'onboarding':
        return 'new';
      case 'profile_complete':
        return 'profile_setup';
      case 'quiz_complete':
        return 'quiz_taken';
      case 'test_complete':
        return 'test_completed';
      default:
        return 'active_user';
    }
  }
  
  async getStatus() {
    return await this.enhancedEngine.getEngineStatus();
  }
}

// Export singleton instance
export const chatbotEngine = new EnhancedChatbotEngine();