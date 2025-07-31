import { supabase } from "@/integrations/supabase/client";

// Client-side security utilities

export interface SecurityCheckResult {
  isSecure: boolean;
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export class SecurityMonitor {
  private static instance: SecurityMonitor;
  private actionCounts: Map<string, number> = new Map();
  private lastReset = Date.now();

  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }

  // Track user actions for anomaly detection
  trackAction(actionType: string): void {
    const now = Date.now();
    
    // Reset counters every hour
    if (now - this.lastReset > 3600000) {
      this.actionCounts.clear();
      this.lastReset = now;
    }

    const current = this.actionCounts.get(actionType) || 0;
    this.actionCounts.set(actionType, current + 1);
  }

  // Check for suspicious activity patterns
  checkSuspiciousActivity(): SecurityCheckResult {
    const warnings: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for rapid actions
    const totalActions = Array.from(this.actionCounts.values()).reduce((sum, count) => sum + count, 0);
    
    if (totalActions > 100) {
      warnings.push('High activity volume detected');
      riskLevel = 'medium';
    }

    // Check for specific action patterns
    const reportCount = this.actionCounts.get('report') || 0;
    const blockCount = this.actionCounts.get('block') || 0;

    if (reportCount > 10) {
      warnings.push('Excessive reporting detected');
      riskLevel = 'high';
    }

    if (blockCount > 20) {
      warnings.push('Excessive blocking detected');
      riskLevel = 'high';
    }

    return {
      isSecure: warnings.length === 0,
      warnings,
      riskLevel
    };
  }
}

// Enhanced input sanitization
export function sanitizeInput(input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  trimWhitespace?: boolean;
} = {}): string {
  let sanitized = input;

  // Trim whitespace
  if (options.trimWhitespace !== false) {
    sanitized = sanitized.trim();
  }

  // Remove HTML tags unless explicitly allowed
  if (!options.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>\"'&]/g, '');

  // Enforce length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

// Check for common XSS patterns
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[\s\S]*?>/gi,
    /<object[\s\S]*?>/gi,
    /<embed[\s\S]*?>/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

// Validate URLs for safety
export function validateSafeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Only allow HTTPS and HTTP
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    // Block suspicious domains
    const suspiciousDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '192.168.',
      '10.',
      '172.',
    ];

    return !suspiciousDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

// Rate limiting helper for client-side
export async function checkClientRateLimit(
  actionType: string, 
  maxRequests: number = 10, 
  windowMinutes: number = 60
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_action_type: actionType,
      p_max_requests: maxRequests,
      p_window_minutes: windowMinutes
    });

    return !!data;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return false;
  }
}

// Log security events
export async function logSecurityEvent(
  eventType: string, 
  eventData: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
        ip_address: null, // Will be populated by server
        user_agent: navigator.userAgent
      });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Enhanced password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Pattern checks
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeated characters');

  const isStrong = score >= 5;

  return { score, feedback, isStrong };
}