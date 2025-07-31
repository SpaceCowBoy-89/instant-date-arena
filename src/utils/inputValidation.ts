import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

export async function validateUserInput(
  type: 'profile' | 'message' | 'verification' | 'report',
  data: any
): Promise<ValidationResult> {
  // First run client-side validation as first line of defense
  const clientValidation = clientSideValidation(type, data);
  if (!clientValidation.isValid) {
    return clientValidation;
  }

  try {
    // Check rate limits for validation requests
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: rateLimitCheck } = await supabase.rpc('check_rate_limit', {
        p_identifier: user.id,
        p_action_type: 'validation_request',
        p_max_requests: 50,
        p_window_minutes: 15
      });

      if (!rateLimitCheck) {
        return {
          isValid: false,
          errors: ['Too many validation requests. Please slow down.']
        };
      }
    }

    const { data: result, error } = await supabase.functions.invoke('validate-user-input', {
      body: { type, data }
    });

    if (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        errors: ['Validation service unavailable. Please try again.']
      };
    }

    return result;
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      errors: ['Validation service unavailable. Please try again.']
    };
  }
}

// Client-side validation as fallback
export function clientSideValidation(type: string, data: any): ValidationResult {
  const errors: string[] = [];

  switch (type) {
    case 'profile':
      if (data.name && (data.name.length < 2 || data.name.length > 50)) {
        errors.push('Name must be between 2 and 50 characters');
      }
      if (data.bio && data.bio.length > 500) {
        errors.push('Bio must be less than 500 characters');
      }
      if (data.age && (data.age < 18 || data.age > 100)) {
        errors.push('Age must be between 18 and 100');
      }
      break;
    
    case 'message':
      if (!data.message || data.message.trim().length === 0) {
        errors.push('Message cannot be empty');
      } else if (data.message.length > 1000) {
        errors.push('Message must be less than 1000 characters');
      }
      break;
    
    case 'verification':
      if (!data.verification_type) {
        errors.push('Verification type is required');
      }
      if (!data.verification_data?.value) {
        errors.push('Verification data is required');
      }
      break;
    
    case 'report':
      if (!data.report_type) {
        errors.push('Report type is required');
      }
      if (data.description && data.description.length > 500) {
        errors.push('Description must be less than 500 characters');
      }
      break;
  }

  return { isValid: errors.length === 0, errors };
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .trim();
}