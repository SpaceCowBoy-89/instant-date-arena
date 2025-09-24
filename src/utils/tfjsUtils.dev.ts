// Development-only TensorFlow utils that bypasses ML dependencies

export const getEmbedding = async (texts: string[]): Promise<number[]> => {
  console.log('🚀 Dev mode: Skipping ML embedding for texts:', texts[0]?.substring(0, 30));
  // Return mock embedding
  return new Array(512).fill(0).map(() => Math.random());
};

export const computeSimilarity = (emb1: number[], emb2: number[]): number => {
  // Return mock similarity
  return Math.random() * 0.5 + 0.5; // Random between 0.5-1.0
};

export const checkToxicity = async (text: string): Promise<boolean> => {
  console.log('🚀 Dev mode: Skipping toxicity check for:', text.substring(0, 30));
  // Simple rule-based check for development
  return !['spam', 'toxic', 'bad'].some(word => text.toLowerCase().includes(word));
};

export const analyzeBio = async (bio: string): Promise<string> => {
  console.log('🚀 Dev mode: Skipping bio analysis');
  return 'Looking good! (dev mode)';
};

export const getWittyVariant = async (baseText: string, input: string): Promise<string> => {
  console.log('🚀 Dev mode: Skipping witty variant generation');
  return baseText;
};

export const classifyVibe = async (input: string): Promise<string> => {
  console.log('🚀 Dev mode: Skipping vibe classification');
  const vibes = ['romantic', 'funny', 'adventurous', 'chill'];
  return vibes[Math.floor(Math.random() * vibes.length)];
};

export const getMatchTeaser = async (userId: string): Promise<string> => {
  return 'Great match potential! (dev mode)';
};

export const verifyFace = async (image: HTMLImageElement | HTMLCanvasElement): Promise<boolean> => {
  console.log('🚀 Dev mode: Skipping face verification');
  return true; // Always pass in dev mode
};