// Dynamic import prevents eager loading of ML dependencies
let initialized = false;

export async function ensureModerationInitialized() {
  if (!initialized) {
    try {
      // Use dev service in development to avoid ML loading
      const { initializeModeration } = await import(
        import.meta.env.DEV
          ? '@/services/moderation.dev'
          : '@/services/moderation'
      );
      await initializeModeration();
      initialized = true;
      console.log('✅ Moderation service initialized');
    } catch (error) {
      console.warn('⚠️ Moderation service initialization failed, using fallback:', error);
      initialized = true; // Still set to true to avoid repeated attempts
    }
  }
}

// Don't auto-initialize - wait for explicit call to avoid blocking app startup