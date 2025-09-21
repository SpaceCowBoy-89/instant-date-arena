import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { messageId, groupId, senderId, message } = await req.json()

    if (!messageId || !groupId || !senderId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Processing group message notification:', { messageId, groupId, senderId })

    // Get sender info
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('name')
      .eq('id', senderId)
      .single()

    if (senderError) {
      console.error('Error fetching sender data:', senderError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sender data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get group info
    const { data: groupData, error: groupError } = await supabase
      .from('connections_groups')
      .select('tag_name')
      .eq('id', groupId)
      .single()

    if (groupError) {
      console.error('Error fetching group data:', groupError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch group data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all group members except the sender
    const { data: members, error: membersError } = await supabase
      .from('user_connections_groups')
      .select(`
        user_id,
        users!inner (
          id,
          name,
          preferences
        )
      `)
      .eq('group_id', groupId)
      .neq('user_id', senderId)

    if (membersError) {
      console.error('Error fetching group members:', membersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch group members' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter members who have group chat notifications enabled
    const notifiableMembers = members?.filter(member => {
      const prefs = member.users.preferences as any
      return prefs?.notifications?.groupChat !== false && prefs?.notifications?.push !== false
    }) || []

    console.log(`Found ${notifiableMembers.length} members to notify`)

    // Create notification logs for each member
    const notificationPromises = notifiableMembers.map(async (member) => {
      // Truncate message for notification
      const truncatedMessage = message.length > 100 ? 
        message.substring(0, 100) + '...' : 
        message

      const title = `${groupData.tag_name}`
      const notificationMessage = `${senderData.name}: ${truncatedMessage}`

      // Log notification in database
      const { error: logError } = await supabase
        .from('notification_logs')
        .insert([
          {
            user_id: member.user_id,
            type: 'group_message',
            title,
            message: notificationMessage,
            status: 'pending'
          }
        ])

      if (logError) {
        console.error('Error logging notification:', logError)
      }

      return {
        userId: member.user_id,
        title,
        message: notificationMessage
      }
    })

    const notifications = await Promise.all(notificationPromises)

    console.log(`Successfully processed ${notifications.length} notifications`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificationsSent: notifications.length,
        recipients: notifications.map(n => n.userId)
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-group-message-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})