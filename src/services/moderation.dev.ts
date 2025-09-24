// Development-only moderation service that bypasses ML dependencies
export async function initializeModeration() {
  console.log('🚀 Using dev moderation service - ML disabled for fast startup');
}

export async function moderateText(text: string): Promise<{ isAppropriate: boolean; confidence: number }> {
  console.log('🚀 Dev mode: Skipping ML moderation for text:', text.substring(0, 50));

  // Simple rule-based moderation for development
  const inappropriate = ['spam', 'test-bad-word', 'explicit'].some(word =>
    text.toLowerCase().includes(word)
  );

  return {
    isAppropriate: !inappropriate,
    confidence: 0.9
  };
}