
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface User {
  user_id: string;
  status: string;
}

interface MatchResult {
  success: boolean;
  chat_id?: string;
  user1_id?: string;
  user2_id?: string;
  message: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to identify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Authorization required' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid authorization' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`User ${user.id} requesting match`);

    // Check daily match limit for the requesting user
    const { data: limitResult, error: limitError } = await supabaseClient
      .rpc('check_and_increment_match_usage', { p_user_id: user.id });

    if (limitError) {
      console.error('Error checking match limit:', limitError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error checking daily limit' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Limit check result:', limitResult);

    if (!limitResult.allowed) {
      // Remove user from queue since they hit the limit
      await supabaseClient
        .from('queue')
        .delete()
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          message: limitResult.message,
          daily_limit_reached: true,
          current_usage: limitResult.current_usage,
          daily_limit: limitResult.daily_limit
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get waiting users from queue (excluding the current user)
    const { data: waitingUsers, error: queueError } = await supabaseClient
      .from('queue')
      .select('user_id, status')
      .eq('status', 'waiting')
      .neq('user_id', user.id)
      .limit(1);

    if (queueError) {
      console.error('Error fetching queue:', queueError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching queue' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${waitingUsers?.length || 0} waiting users (excluding current user)`);

    // Check if we have another user waiting
    if (!waitingUsers || waitingUsers.length < 1) {
      // No match found, user stays in queue
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No other users available for matching. You will remain in the queue.' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const otherUser = waitingUsers[0];

    console.log(`Matching users: ${user.id} and ${otherUser.user_id}`);

    // Create a new chat session
    const { data: newChat, error: chatError } = await supabaseClient
      .from('chats')
      .insert({
        user1_id: user.id,
        user2_id: otherUser.user_id,
        messages: []
      })
      .select('chat_id')
      .single();

    if (chatError) {
      console.error('Error creating chat:', chatError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error creating chat' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Created new chat: ${newChat.chat_id}`);

    // Remove both users from queue since they've been matched
    const { error: removeQueueError } = await supabaseClient
      .from('queue')
      .delete()
      .in('user_id', [user.id, otherUser.user_id]);

    if (removeQueueError) {
      console.error('Error removing users from queue:', removeQueueError);
      // Continue anyway, the chat was created successfully
    }

    console.log('Successfully matched users and removed them from queue');

    const result: MatchResult = {
      success: true,
      chat_id: newChat.chat_id,
      user1_id: user.id,
      user2_id: otherUser.user_id,
      message: 'Match created successfully!'
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Matchmaker error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Internal server error during matchmaking',
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
