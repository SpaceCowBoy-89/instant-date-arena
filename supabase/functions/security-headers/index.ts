import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://rbxnndsqgscxamvlxloh.supabase.co wss://rbxnndsqgscxamvlxloh.supabase.co; font-src 'self' https:; media-src 'self' https:; object-src 'none'; frame-ancestors 'none';",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    const { pathname } = new URL(req.url);
    
    // This function can be used to add security headers to responses
    // It's mainly a reference implementation for security best practices
    
    return new Response(
      JSON.stringify({
        message: 'Security headers configured',
        headers: securityHeaders,
        path: pathname
      }),
      {
        headers: {
          ...corsHeaders,
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Security headers error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          ...securityHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});