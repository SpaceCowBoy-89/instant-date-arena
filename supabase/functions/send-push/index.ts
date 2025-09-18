import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, message, title = 'SpeedHeart Notification' } = await req.json()

    if (!user_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id or message' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log the notification attempt
    const { error: logError } = await supabaseClient
      .from('notification_logs')
      .insert({
        user_id,
        type: 'push',
        title,
        message,
        sent_at: new Date().toISOString(),
        status: 'sent'
      })

    if (logError) {
      console.warn('Failed to log notification:', logError)
    }

    console.log(`Push notification sent to user ${user_id}: ${title} - ${message}`)

    // For now, we'll just log the notification
    // In a real implementation, you would integrate with a push notification service
    // like Firebase Cloud Messaging, OneSignal, or similar

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push notification logged successfully',
        user_id,
        title,
        content: message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in send-push function:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})