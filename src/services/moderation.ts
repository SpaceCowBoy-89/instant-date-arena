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
  // Simple keyword-based moderation as fallback
  const inappropriateWords = [
    'spam', 'hate', 'harassment', 'bullying', 'threat', 'violence',
    'inappropriate', 'harmful', 'toxic', 'abuse', 'discrimination'
  ];
  
  const lowerText = text.toLowerCase();
  const hasInappropriateContent = inappropriateWords.some(word => lowerText.includes(word));
  
  return {
    isAppropriate: !hasInappropriateContent,
    confidence: hasInappropriateContent ? 0.9 : 0.1
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