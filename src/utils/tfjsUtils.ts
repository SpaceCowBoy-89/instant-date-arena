import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import * as toxicity from '@tensorflow-models/toxicity';

interface UniversalSentenceEncoder {
  embed: (texts: string[]) => Promise<tf.Tensor2D>;
}

interface ToxicityClassifier {
  classify: (texts: string[]) => Promise<any[]>;
}

let useModel: UniversalSentenceEncoder | null = null;
let toxicityModel: ToxicityClassifier | null = null;
let blazeFaceModel: any | null = null;
let mobileFaceNetModel: any | null = null;

const loadUSE = async (): Promise<UniversalSentenceEncoder> => {
  if (!useModel) {
    try {
      useModel = await use.load();
    } catch (error) {
      console.error('Error loading USE model:', error);
      throw error;
    }
  }
  return useModel;
};

const loadToxicity = async (): Promise<ToxicityClassifier> => {
  if (!toxicityModel) {
    try {
      toxicityModel = await toxicity.load();
    } catch (error) {
      console.error('Error loading Toxicity model:', error);
      throw error;
    }
  }
  return toxicityModel;
};

const loadBlazeFace = async () => {
  if (!blazeFaceModel) {
    try {
      blazeFaceModel = await tf.loadGraphModel('https://tfhub.dev/tensorflow/tfjs-model/blazeface/1/default/1');
    } catch (error) {
      console.error('Error loading BlazeFace model:', error);
      throw error;
    }
  }
  return blazeFaceModel;
};

const loadMobileFaceNet = async () => {
  if (!mobileFaceNetModel) {
    try {
      mobileFaceNetModel = await tf.loadGraphModel('/assets/models/mobilefacenet/model.json');
    } catch (error) {
      console.error('Error loading MobileFaceNet model:', error);
      throw error;
    }
  }
  return mobileFaceNetModel;
};

export const getEmbedding = async (texts: string[]): Promise<number[]> => {
  try {
    const model = await loadUSE();
    const embeddings = await model.embed(texts);
    const embeddingArray = embeddings.arraySync();
    embeddings.dispose();
    return embeddingArray[0];
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
};

export const computeSimilarity = (emb1: number[], emb2: number[]): number => {
  if (!emb1.length || !emb2.length) return 0;
  const dot = emb1.reduce((sum, val, i) => sum + val * emb2[i], 0);
  const mag1 = Math.sqrt(emb1.reduce((sum, val) => sum + val ** 2, 0));
  const mag2 = Math.sqrt(emb2.reduce((sum, val) => sum + val ** 2, 0));
  return mag1 * mag2 === 0 ? 0 : dot / (mag1 * mag2);
};

export const checkToxicity = async (text: string): Promise<boolean> => {
  try {
    const model = await loadToxicity();
    const predictions = await model.classify([text]);
    return !predictions.some((pred: any) => pred.results[0].probabilities[1] > 0.5);
  } catch (error) {
    console.error('Error checking toxicity:', error);
    return true;
  }
};

export const analyzeBio = async (bio: string): Promise<string> => {
  if (!bio) return 'add something fun like "loves midnight hikes" for that mysterious vibe!';
  try {
    const embedding = await getEmbedding([bio]);
    const positiveKeywords = await getEmbedding(['adventurous', 'funny', 'romantic', 'mysterious']);
    const sim = computeSimilarity(embedding, positiveKeywords);
    if (sim > 0.7) return 'it\'s already sparkling—keep shining!';
    return 'add "loves midnight hikes" for that mysterious vibe! 💫';
  } catch (error) {
    console.error('Error analyzing bio:', error);
    return 'add some interests to make it pop!';
  }
};

export const getWittyVariant = async (baseText: string, input: string): Promise<string> => {
  try {
    const wittyVariants = [
      baseText,
      `Ooh, ${baseText.toLowerCase()}? Let's make it flirty! 😏`,
      `${baseText} Here's a hot tip: Swipe with heart! 💖`,
      `Feeling spicy? ${baseText} Let's heat things up! 🔥`,
    ];
    const inputEmb = await getEmbedding([input]);
    const variantEmbs = await Promise.all(wittyVariants.map(v => getEmbedding([v])));
    const similarities = variantEmbs.map(emb => computeSimilarity(inputEmb, emb));
    const maxIndex = similarities.indexOf(Math.max(...similarities));
    return wittyVariants[maxIndex];
  } catch (error) {
    console.error('Error getting witty variant:', error);
    return baseText;
  }
};

export const classifyVibe = async (input: string): Promise<string> => {
  const vibes = ['romantic', 'funny', 'adventurous', 'chill'];
  try {
    const inputEmb = await getEmbedding([input]);
    const vibeEmbs = await getEmbedding(vibes);
    const similarities = vibes.map((_, i) => computeSimilarity(inputEmb, vibeEmbs[i]));
    const maxIndex = similarities.indexOf(Math.max(...similarities));
    return vibes[maxIndex];
  } catch (error) {
    console.error('Error classifying vibe:', error);
    return 'funny';
  }
};

export const getMatchTeaser = async (userId: string): Promise<string> => {
  try {
    return 'Swipe right on that adventure-seeker—your profiles scream compatibility!';
  } catch (error) {
    console.error('Error fetching match teaser:', error);
    return 'Find someone who loves adventures like you!';
  }
};

export const verifyFace = async (image: HTMLImageElement | HTMLCanvasElement): Promise<boolean> => {
  try {
    const blazeFace = await loadBlazeFace();
    const tensor = tf.browser.fromPixels(image).toFloat().div(255.0).expandDims();
    const predictions = await blazeFace.predict(tensor) as tf.Tensor;
    const faceDetected = predictions.dataSync()[0] > 0.9; // Threshold for detection
    tensor.dispose();
    predictions.dispose();

    if (!faceDetected) return false;

    const mobileFaceNet = await loadMobileFaceNet();
    const embedding = await mobileFaceNet.predict(tensor) as tf.Tensor;
    const isVerified = embedding.dataSync()[0] > 0.9; // Threshold for recognition
    embedding.dispose();
    return isVerified;
  } catch (error) {
    console.error('Error verifying face:', error);
    return false;
  }
};