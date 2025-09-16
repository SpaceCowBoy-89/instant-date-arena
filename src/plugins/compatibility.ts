import { registerPlugin } from '@capacitor/core';

export interface CompatibilityPlugin {
  predictCompatibility(options: {
    features: {
      Adventure: number;
      Anime: number;
      Creative: number;
      Fantasy: number;
      Tech: number;
      agreeableness: number;
      conscientiousness: number;
      extraversion: number;
      neuroticism: number;
      openness: number;
      same_location: number;
    }
  }): Promise<{ probability: number }>;
}

const CompatibilityPlugin = registerPlugin<CompatibilityPlugin>('CompatibilityPlugin');

export default CompatibilityPlugin;