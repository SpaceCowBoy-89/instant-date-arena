import * as tf from '@tensorflow/tfjs';
// Temporary stub - @tensorflow/tfjs-tflite is not available
import * as ort from 'onnxruntime-web';
import { AutoTokenizer } from '@xenova/transformers';

let tfliteModel: any = null;
let onnxSession: ort.InferenceSession | null = null;
let tokenizer: any = null;

async function loadTFLiteClassifier() {
  try {
    await tf.ready();
    // Stub - TFLite not available
    console.log('TFLite classifier stubbed');
  } catch (error) {
    console.error('Failed to load TFLite model:', error);
    throw error;
  }
}

async function loadONNXClassifier() {
  try {
    onnxSession = await ort.InferenceSession.create('/assets/models/MiniLM-L6-v2/mlp_classifier.onnx');
    tokenizer = await AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2');
    console.log('ONNX classifier and tokenizer loaded');
  } catch (error) {
    console.error('Failed to load ONNX model or tokenizer:', error);
    throw error;
  }
}

export async function initializeModeration() {
  try {
    await loadONNXClassifier();
  } catch (error) {
    console.warn('ONNX loading failed, falling back to basic moderation:', error);
  }
}

export async function moderateText(text: string): Promise<{ isAppropriate: boolean; confidence: number }> {
  // Try ONNX model first if available
  if (onnxSession && tokenizer) {
    try {
      // Tokenize the text
      const tokens = await tokenizer.encode(text);
      const inputIds = tokens.input_ids || tokens;
      const attentionMask = tokens.attention_mask || Array(inputIds.length).fill(1);
      
      // Pad or truncate to model's expected input length (typically 512 for BERT models)
      const maxLength = 512;
      const paddedInputIds = new Array(maxLength).fill(0);
      const paddedAttentionMask = new Array(maxLength).fill(0);
      
      for (let i = 0; i < Math.min(inputIds.length, maxLength); i++) {
        paddedInputIds[i] = inputIds[i];
        paddedAttentionMask[i] = attentionMask[i];
      }
      
      // Create tensor inputs for the ONNX model
      const inputTensor = new ort.Tensor('int64', paddedInputIds, [1, maxLength]);
      const maskTensor = new ort.Tensor('int64', paddedAttentionMask, [1, maxLength]);
      
      // Run inference
      const outputs = await onnxSession.run({
        'input_ids': inputTensor,
        'attention_mask': maskTensor
      });
      
      // Extract probability from output (assuming binary classification)
      const logits = outputs['logits'] || outputs['output'] || Object.values(outputs)[0];
      const probabilities = logits.data as Float32Array;
      
      // Apply softmax to get proper probabilities
      const maxLogit = Math.max(...Array.from(probabilities));
      const expLogits = Array.from(probabilities).map(x => Math.exp(x - maxLogit));
      const sumExp = expLogits.reduce((a, b) => a + b, 0);
      const softmaxProbs = expLogits.map(x => x / sumExp);
      
      // Assuming the model outputs [inappropriate_prob, appropriate_prob]
      const inappropriateProb = softmaxProbs[0];
      const appropriateProb = softmaxProbs[1] || (1 - inappropriateProb);
      
      const threshold = 0.5;
      const isAppropriate = inappropriateProb < threshold;
      const confidence = Math.max(inappropriateProb, appropriateProb);
      
      return {
        isAppropriate,
        confidence
      };
    } catch (error) {
      console.warn('ONNX model inference failed, falling back to keyword moderation:', error);
    }
  }

  // Fallback to enhanced keyword-based moderation
  const inappropriateWords = [
    // Explicit content
    'spam', 'hate', 'harassment', 'bullying', 'threat', 'violence',
    'inappropriate', 'harmful', 'toxic', 'abuse', 'discrimination',
    // Dating-specific inappropriate content
    'escort', 'prostitute', 'hookup', 'casual sex', 'one night stand',
    'sugar daddy', 'sugar baby', 'findom', 'venmo', 'paypal', 'cashapp',
    // Scam indicators
    'bitcoin', 'crypto', 'investment', 'trading', 'make money fast',
    'lonely', 'verification', 'telegram', 'whatsapp', 'kik',
    // Harassment/offensive
    'kill yourself', 'die', 'stupid', 'ugly', 'fat', 'loser'
  ];
  
  const suspiciousPatterns = [
    /\b\d{10,}\b/, // Phone numbers
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email addresses
    /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/, // URLs
    /(?:instagram|snapchat|twitter|facebook)\.com\/\w+/, // Social media links
    /\$\d+/, // Money mentions
  ];
  
  const lowerText = text.toLowerCase();
  const hasInappropriateWords = inappropriateWords.some(word => lowerText.includes(word));
  const hasSuspiciousPatterns = suspiciousPatterns.some(pattern => pattern.test(text));
  
  const hasInappropriateContent = hasInappropriateWords || hasSuspiciousPatterns;
  
  return {
    isAppropriate: !hasInappropriateContent,
    confidence: hasInappropriateContent ? 0.85 : 0.15
  };
}

export async function moderateImage(imageUrl: string): Promise<{ isAppropriate: boolean; confidence: number }> {
  // Basic image moderation - always approve for now
  return {
    isAppropriate: true,
    confidence: 0.5
  };
}

export async function detectInappropriateContent(content: string): Promise<boolean> {
  const result = await moderateText(content);
  return !result.isAppropriate;
}

export async function enforceContentPolicy(text: string): Promise<boolean> {
  const result = await moderateText(text);
  return result.isAppropriate;
}