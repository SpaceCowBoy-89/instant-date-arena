import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArenaNotificationRequest {
  id: string;
  user_id: string;
  arena_id: string;
  scheduled_for: string;
  notification_sent: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { arena_id, arena_name, action = 'notify' } = await req.json()

    if (!arena_id) {
      return new Response(
        JSON.stringify({ error: 'Missing arena_id' }),
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

    if (action === 'notify') {
      // Get all active notification requests for this arena
      const { data: notifications, error: fetchError } = await supabaseClient
        .from('arena_notification_requests')
        .select('*')
        .eq('arena_id', arena_id)
        .eq('is_active', true)
        .eq('notification_sent', false)

      if (fetchError) {
        console.error('Error fetching notification requests:', fetchError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch notification requests' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }

      if (!notifications || notifications.length === 0) {
        return new Response(
          JSON.stringify({ 
            message: 'No active notification requests found',
            arena_id,
            notifications_sent: 0
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        )
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each notification request
      for (const notification of notifications as ArenaNotificationRequest[]) {
        try {
          // Send notification via the send-push function
          const notificationPayload = {
            user_id: notification.user_id,
            title: `🚀 ${arena_name || notification.arena_id} is Live!`,
            message: `The arena you requested notifications for is now active. Join now!`
          }

          const pushResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(notificationPayload)
          })

          if (!pushResponse.ok) {
            console.error(`Failed to send push notification to user ${notification.user_id}:`, await pushResponse.text())
            errorCount++
            continue
          }

          // Mark notification as sent
          const { error: updateError } = await supabaseClient
            .from('arena_notification_requests')
            .update({ 
              notification_sent: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          if (updateError) {
            console.error(`Failed to update notification status for ${notification.id}:`, updateError)
            errorCount++
          } else {
            successCount++
            console.log(`Successfully sent notification to user ${notification.user_id} for arena ${arena_id}`)
          }

        } catch (error) {
          console.error(`Error processing notification for user ${notification.user_id}:`, error)
          errorCount++
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Arena notifications processed',
          arena_id,
          total_requests: notifications.length,
          notifications_sent: successCount,
          errors: errorCount
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )

    } else if (action === 'cleanup') {
      // Clean up old notification requests (older than 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { error: cleanupError } = await supabaseClient
        .from('arena_notification_requests')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString())

      if (cleanupError) {
        console.error('Error cleaning up old notifications:', cleanupError)
        return new Response(
          JSON.stringify({ error: 'Failed to cleanup old notifications' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Old notification requests cleaned up',
          cutoff_date: sevenDaysAgo.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "notify" or "cleanup"' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )

  } catch (error) {
    console.error('Error in process-arena-notifications function:', error)

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