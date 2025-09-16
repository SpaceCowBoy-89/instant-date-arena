import * as tf from '@tensorflow/tfjs';
// Temporary stub - @tensorflow/tfjs-tflite is not available
// import { loadTFLiteModel } from '@tensorflow/tfjs-tflite';
import * as ort from 'onnxruntime-web';
import { AutoTokenizer } from '@xenova/transformers';

let tfliteModel;
let onnxSession;
let tokenizer;

async function loadTFLiteClassifier() {
  try {
    await tf.ready();
    tfliteModel = await loadTFLiteModel('/assets/models/MiniLM-L6-v2/mlp_classifier.tflite');
    console.log('TFLite classifier loaded');
  } catch (error) {
    console.error('Failed to load TFLite model:', error);
    throw error;
  }
}

async function loadOnnxEmbeddingModel() {
  try {
    onnxSession = await ort.InferenceSession.create('/assets/models/MiniLM-L6-v2/minilm_onnx/model.onnx');
    console.log('ONNX embedding model loaded');
  } catch (error) {
    console.error('Failed to load ONNX model:', error);
    throw error;
  }
}

async function loadTokenizer() {
  try {
    tokenizer = await AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2');
    console.log('Tokenizer loaded');
  } catch (error) {
    console.error('Failed to load tokenizer:', error);
    throw error;
  }
}


async function moderateText(text) {
  try {
    // Load models and tokenizer if not already loaded
    if (!onnxSession) await loadOnnxEmbeddingModel();
    if (!tfliteModel) await loadTFLiteClassifier();
    if (!tokenizer) await loadTokenizer();

    // Tokenize text
    const tokens = tokenizer.encode(text, {
      padding: true,
      truncation: true,
      max_length: 512,
    });

    // Prepare ONNX input
    const inputIds = new ort.Tensor('int32', tokens.input_ids, [1, tokens.input_ids.length]);
    const attentionMask = new ort.Tensor('int32', tokens.attention_mask, [1, tokens.attention_mask.length]);

    // Generate embeddings with ONNX
    const inputs = {
      input_ids: inputIds,
      attention_mask: attentionMask,
    };
    const outputs = await onnxSession.run(inputs);
    const embedding = outputs['last_hidden_state'].data; // Adjust if output name differs

    // Classify with TFLite
    const inputTensor = tf.tensor2d([embedding]);
    const prediction = await tfliteModel.predict(inputTensor);
    const label = prediction.argMax(-1).dataSync()[0]; // 0=safe, 1=offensive, 2=spam
    tf.dispose([inputTensor, prediction]);

    return label === 0 ? 'safe' : 'unsafe';
  } catch (error) {
    console.error('Text moderation error:', error);
    return 'error';
  }
}


// Content policy enforcement
function enforceContentPolicy(moderationResult) {
  if (!moderationResult || moderationResult.result === 'error') {
    return { action: 'block', reason: 'Unable to verify content safety' };
  }
  
  if (moderationResult.result === 'safe') {
    return { action: 'allow', confidence: moderationResult.confidence };
  }
  
  if (moderationResult.result === 'review_needed') {
    return { 
      action: 'review', 
      reason: 'Low confidence prediction - requires human review',
      confidence: moderationResult.confidence
    };
  }
  
  // Unsafe content - different actions based on category
  const category = moderationResult.category;
  
  if (category === 'hate_violence') {
    return { 
      action: 'block_permanent', 
      reason: 'Hate speech or violence detected',
      severity: 'critical'
    };
  }
  
  if (category === 'nsfw_explicit') {
    return { 
      action: 'block', 
      reason: 'Explicit content not allowed',
      severity: 'high'
    };
  }
  
  if (category === 'nsfw_suggestive' || category === 'inappropriate') {
    return { 
      action: 'warning', 
      reason: 'Content may not be appropriate for all users',
      severity: 'medium'
    };
  }
  
  return { 
    action: 'block', 
    reason: 'Content does not meet community standards',
    severity: 'medium'
  };
}

export {
  moderateText,
  enforceContentPolicy
};