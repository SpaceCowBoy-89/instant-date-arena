import { initializeModeration } from '@/services/moderation';

// Initialize moderation service when the app starts
let initialized = false;

export async function ensureModerationInitialized() {
  if (!initialized) {
    try {
      await initializeModeration();
      initialized = true;
      console.log('✅ Moderation service initialized');
    } catch (error) {
      console.warn('⚠️ Moderation service initialization failed, using fallback:', error);
      initialized = true; // Still set to true to avoid repeated attempts
    }
  }
}

// Auto-initialize on module load
ensureModerationInitialized();