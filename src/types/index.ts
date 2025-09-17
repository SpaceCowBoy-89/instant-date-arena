/**
 * Core TypeScript interfaces to replace 'any' types
 * Provides better type safety and developer experience
 */

// User-related interfaces
export interface UserPreferences {
  gender_preference?: string;
  age_range?: {
    min: number;
    max: number;
  };
  distance_range?: number;
  interests?: string[];
  notifications?: {
    push: boolean;
    email: boolean;
    inApp: boolean;
  };
  privacy?: {
    showAge: boolean;
    showDistance: boolean;
    showOnlineStatus: boolean;
  };
  matching?: {
    compatibility_required: boolean;
    verification_required: boolean;
  };
}

export interface UserPhotos {
  url: string;
  id: string;
  uploaded_at: string;
  is_primary?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  bio?: string;
  location?: string;
  photo_url?: string;
  photos?: UserPhotos[];
  preferences?: UserPreferences;
  verification_status?: 'unverified' | 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Chat-related interfaces
export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'system' | 'notification';
  metadata?: {
    edited?: boolean;
    edited_at?: string;
    reply_to?: string;
  };
}

export interface ChatData {
  chat_id: string;
  user1_id: string;
  user2_id: string;
  messages: ChatMessage[];
  temporary_messages: ChatMessage[];
  timer_start_time: string;
  status: 'active' | 'ended_by_departure' | 'ended_manually' | 'completed';
  created_at: string;
  updated_at: string;
  ended_at?: string;
  ended_by?: string;
}

// Community-related interfaces
export interface CommunityGroup {
  id: string;
  tag_name: string;
  tag_subtitle?: string;
  icon: {
    name: string;
    color?: string;
    background?: string;
  };
  member_count?: number;
  created_at: string;
}

export interface ConnectionsAnswer {
  text: string;
  tags: string[];
  interests: string[];
  groups: string[];
}

export interface ConnectionsQuestion {
  id: string;
  question: string;
  answers: ConnectionsAnswer[];
  created_at: string;
}

// Group Message interface for connections_group_messages table
export interface GroupMessage {
  id: string;
  user_id: string;
  message: string; // matches database field
  created_at: string; // matches database field
  users?: {
    id: string;
    name: string;
    photo_url?: string;
  };
}

// Real-time payload for group messages (matches what Supabase sends)
export interface GroupMessagePayload {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  group_id: string;
}

// Compatibility test interfaces
export interface CompatibilityScores {
  extroversion_score?: number;
  agreeableness_score?: number;
  openness_to_experience_score?: number;
  conscientiousness_score?: number;
  neuroticism_score?: number;
  directness_score?: number;
  emotional_intelligence_score?: number;
  communication_style_score?: number;
  flexibility_score?: number;
}

export interface CompatibilityMatch {
  compatibility_score: number;
  compatibility_label: string;
  shared_interests: string[];
  user1_profile: UserProfile;
  user2_profile: UserProfile;
  extroversion_diff?: number;
  agreeableness_diff?: number;
  age_diff?: number;
  created_at: string;
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: Record<string, unknown>;
  warnings?: string[];
}

export interface ValidationRequest {
  type: 'profile' | 'message' | 'verification' | 'report';
  data: Record<string, unknown>;
  userId?: string;
}

// Component prop interfaces
export interface MarqueeProps {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
  children: React.ReactNode;
  [key: string]: unknown; // Allow additional props for flexibility
}

// Event interfaces
export interface CommunityEvent {
  id: string;
  group_id: string;
  creator_id: string;
  title: string;
  description?: string;
  location?: string;
  event_date: string;
  max_attendees?: number;
  current_attendees?: number;
  created_at: string;
  updated_at: string;
}

// Real-time subscription types
export interface RealtimePayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  errors?: string[];
}

export interface PresenceState {
  user_id: string;
  online_at?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  [key: string]: unknown;
}

export interface PresencePayload {
  type: 'presence_sync' | 'presence_join' | 'presence_leave';
  key?: string;
  newPresences?: PresenceState[];
  leftPresences?: PresenceState[];
  state?: Record<string, PresenceState>;
}


// ML/AI Model types
export interface MLModelPrediction {
  probability: number;
  confidence?: number;
  features?: Record<string, number>;
}

export interface ModelStatus {
  loaded: boolean;
  modelSize: number;
  version?: string;
  loadTime?: number;
}

export interface MediaPipeLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface HeadPoseData {
  pitch: number;
  yaw: number;
  roll: number;
}

// Configuration types
export interface OptimizationConfig {
  enabled: boolean;
  debounceMs?: number;
  throttleMs?: number;
  retryAttempts?: number;
  retryDelay?: number;
  priority?: 'high' | 'medium' | 'low';
}

export interface InteractionMetrics {
  subscriptionKey: string;
  timestamp: number;
  action: string;
  duration?: number;
  success: boolean;
  error?: string;
}

// Validation and form types
export interface FormData {
  [key: string]: string | number | boolean | File | undefined;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

// Answer and Question types
export interface QuizAnswer {
  text: string;
  tags: string[];
  interests: string[];
  groups: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
  created_at: string;
}

// Icon configuration
export interface IconConfig {
  name: string;
  color?: string;
  background?: string;
}

// Error handling interfaces
export interface AppError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: AppError;
}