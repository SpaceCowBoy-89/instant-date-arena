// Test file for cross-platform compatibility algorithm
import { predictCompatibilityOffline } from './compatibilityUtils';

// Test function to validate compatibility algorithm across platforms
export const testCompatibilityAlgorithm = async () => {
  // Sample user features for testing
  const testFeatures = {
    Adventure: 4.0,
    Anime: 3.0,
    Creative: 4.5,
    Fantasy: 3.5,
    Tech: 4.0,
    agreeableness: 3.8,
    conscientiousness: 4.2,
    extraversion: 3.5,
    neuroticism: 2.0,
    openness: 4.0,
    same_location: 1.0
  };

  console.log('Testing cross-platform compatibility algorithm...');
  console.log('Input features:', testFeatures);

  try {
    const result = await predictCompatibilityOffline(testFeatures, {});
    console.log('Compatibility prediction result:', result);

    if (result !== null) {
      console.log(`Compatibility score: ${Math.round(result * 100)}%`);

      // Expected range validation
      if (result >= 0 && result <= 1) {
        console.log('✅ Result is within valid range (0-1)');
      } else {
        console.error('❌ Result is outside valid range');
      }

      // Algorithm consistency check
      if (result > 0.5) {
        console.log('✅ Algorithm indicates good compatibility');
      } else {
        console.log('ℹ️ Algorithm indicates lower compatibility');
      }
    } else {
      console.log('❌ Algorithm returned null - fallback may be needed');
    }
  } catch (error) {
    console.error('Error testing compatibility algorithm:', error);
  }
};

// Export for debugging in console
if (typeof window !== 'undefined') {
  (window as any).testCompatibilityAlgorithm = testCompatibilityAlgorithm;
}