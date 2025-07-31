import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  type: 'profile' | 'message' | 'verification' | 'report';
  data: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check rate limiting
    const rateLimitCheck = await supabaseClient.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'input_validation',
      p_limit: 100,
      p_window_minutes: 60
    });

    if (rateLimitCheck.error) {
      console.error('Rate limit check error:', rateLimitCheck.error);
    } else if (!rateLimitCheck.data.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type, data }: ValidationRequest = await req.json()

    const result = validateInput(type, data)

    // Log security event
    await supabaseClient.rpc('log_security_event', {
      p_user_id: user.id,
      p_event_type: 'input_validation',
      p_severity: result.isValid ? 'info' : 'warning',
      p_details: {
        validation_type: type,
        is_valid: result.isValid,
        errors: result.errors,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Validation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function validateInput(type: string, data: any): ValidationResult {
  const errors: string[] = []
  let sanitizedData: any = {}

  switch (type) {
    case 'profile':
      return validateProfile(data)
    case 'message':
      return validateMessage(data)
    case 'verification':
      return validateVerification(data)
    case 'report':
      return validateReport(data)
    default:
      errors.push('Invalid validation type')
  }

  return { isValid: errors.length === 0, errors, sanitizedData }
}

function validateProfile(data: any): ValidationResult {
  const errors: string[] = []
  const sanitizedData: any = {}

  // Validate name
  if (data.name) {
    const name = sanitizeString(data.name)
    if (name.length < 2) {
      errors.push('Name must be at least 2 characters long')
    } else if (name.length > 50) {
      errors.push('Name must be less than 50 characters')
    } else if (!/^[a-zA-Z\s\u00C0-\u017F\u0100-\u024F]+$/.test(name)) {
      errors.push('Name contains invalid characters')
    } else {
      sanitizedData.name = name
    }
  }

  // Validate bio
  if (data.bio) {
    const bio = sanitizeString(data.bio)
    if (bio.length > 500) {
      errors.push('Bio must be less than 500 characters')
    } else if (containsInappropriateContent(bio)) {
      errors.push('Bio contains inappropriate content')
    } else {
      sanitizedData.bio = bio
    }
  }

  // Validate age
  if (data.age) {
    const age = parseInt(data.age)
    if (isNaN(age) || age < 18 || age > 100) {
      errors.push('Age must be between 18 and 100')
    } else {
      sanitizedData.age = age
    }
  }

  // Validate location
  if (data.location) {
    const location = sanitizeString(data.location)
    if (location.length > 100) {
      errors.push('Location must be less than 100 characters')
    } else {
      sanitizedData.location = location
    }
  }

  return { isValid: errors.length === 0, errors, sanitizedData }
}

function validateMessage(data: any): ValidationResult {
  const errors: string[] = []
  const sanitizedData: any = {}

  if (!data.message) {
    errors.push('Message content is required')
    return { isValid: false, errors }
  }

  const message = sanitizeString(data.message)
  
  if (message.length === 0) {
    errors.push('Message cannot be empty')
  } else if (message.length > 1000) {
    errors.push('Message must be less than 1000 characters')
  } else if (containsInappropriateContent(message)) {
    errors.push('Message contains inappropriate content')
  } else if (isSpam(message)) {
    errors.push('Message appears to be spam')
  } else {
    sanitizedData.message = message
  }

  return { isValid: errors.length === 0, errors, sanitizedData }
}

function validateVerification(data: any): ValidationResult {
  const errors: string[] = []
  const sanitizedData: any = {}

  if (!data.verification_type) {
    errors.push('Verification type is required')
    return { isValid: false, errors }
  }

  const validTypes = ['phone', 'email', 'social_media']
  if (!validTypes.includes(data.verification_type)) {
    errors.push('Invalid verification type')
    return { isValid: false, errors }
  }

  if (!data.verification_data?.value) {
    errors.push('Verification data is required')
    return { isValid: false, errors }
  }

  const value = sanitizeString(data.verification_data.value)
  
  switch (data.verification_type) {
    case 'phone':
      if (!/^\+?[\d\s\-\(\)]{10,15}$/.test(value)) {
        errors.push('Invalid phone number format')
      } else {
        sanitizedData.verification_data = { value: value.replace(/[^\d+]/g, '') }
      }
      break
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push('Invalid email format')
      } else {
        sanitizedData.verification_data = { value: value.toLowerCase() }
      }
      break
    case 'social_media':
      if (!/^https?:\/\/(www\.)?(twitter|instagram|facebook|linkedin)\.com\/.+$/.test(value)) {
        errors.push('Invalid social media URL')
      } else {
        sanitizedData.verification_data = { value }
      }
      break
  }

  if (errors.length === 0) {
    sanitizedData.verification_type = data.verification_type
  }

  return { isValid: errors.length === 0, errors, sanitizedData }
}

function validateReport(data: any): ValidationResult {
  const errors: string[] = []
  const sanitizedData: any = {}

  const validReportTypes = [
    'inappropriate_content', 'harassment', 'fake_profile', 
    'spam', 'underage', 'other'
  ]

  if (!data.report_type || !validReportTypes.includes(data.report_type)) {
    errors.push('Valid report type is required')
    return { isValid: false, errors }
  }

  if (!data.reported_user_id) {
    errors.push('Reported user ID is required')
    return { isValid: false, errors }
  }

  sanitizedData.report_type = data.report_type
  sanitizedData.reported_user_id = data.reported_user_id

  if (data.description) {
    const description = sanitizeString(data.description)
    if (description.length > 500) {
      errors.push('Description must be less than 500 characters')
    } else {
      sanitizedData.description = description
    }
  }

  return { isValid: errors.length === 0, errors, sanitizedData }
}

function sanitizeString(input: string): string {
  // Remove HTML tags and special characters that could be used for XSS
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .trim()
}

function containsInappropriateContent(text: string): boolean {
  // Basic content filtering - in production, use a more sophisticated filter
  const inappropriateWords = [
    'spam', 'scam', 'phishing', 'virus', 'malware',
    // Add more inappropriate words as needed
  ]
  
  const lowerText = text.toLowerCase()
  return inappropriateWords.some(word => lowerText.includes(word))
}

function isSpam(text: string): boolean {
  // Basic spam detection
  const spamPatterns = [
    /(.)\1{4,}/, // Repeated characters
    /https?:\/\/[^\s]+/gi, // URLs (more than 2)
    /\b(buy|sell|money|cash|prize|winner)\b/gi, // Spam keywords
  ]
  
  // Check for repeated characters
  if (spamPatterns[0].test(text)) return true
  
  // Check for multiple URLs
  const urlMatches = text.match(spamPatterns[1])
  if (urlMatches && urlMatches.length > 2) return true
  
  // Check for spam keywords
  const spamMatches = text.match(spamPatterns[2])
  if (spamMatches && spamMatches.length > 3) return true
  
  return false
}