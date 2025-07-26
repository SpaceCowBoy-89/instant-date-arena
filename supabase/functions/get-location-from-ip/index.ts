import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from various possible headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const clientIP = req.headers.get('cf-connecting-ip'); // Cloudflare
    
    // Extract IP (take first one if multiple in x-forwarded-for)
    let ip = forwardedFor?.split(',')[0]?.trim() || realIP || clientIP || 'unknown';
    
    console.log('Detected IP:', ip);
    
    // For development/testing, you might get localhost IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') {
      return new Response(JSON.stringify({ 
        error: 'Cannot detect location from localhost IP',
        ip: ip,
        location: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use ip-api.com (free service, no API key required)
    const locationResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone`);
    
    if (!locationResponse.ok) {
      throw new Error('Failed to fetch location data');
    }

    const locationData = await locationResponse.json();
    
    console.log('Location API response:', locationData);

    if (locationData.status === 'fail') {
      return new Response(JSON.stringify({ 
        error: locationData.message || 'Failed to get location',
        ip: ip,
        location: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format the response with city and state
    const formattedLocation = {
      city: locationData.city,
      state: locationData.regionName, // Full state name
      stateCode: locationData.region, // State abbreviation
      country: locationData.country,
      countryCode: locationData.countryCode,
      zipCode: locationData.zip,
      latitude: locationData.lat,
      longitude: locationData.lon,
      timezone: locationData.timezone,
      // Create a formatted string like "San Francisco, CA"
      displayLocation: `${locationData.city}, ${locationData.region}`
    };

    return new Response(JSON.stringify({ 
      success: true,
      ip: ip,
      location: formattedLocation 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-location-from-ip function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      ip: 'unknown',
      location: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});