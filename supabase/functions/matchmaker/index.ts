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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting matchmaking process...');

    // Get all users waiting in queue
    const { data: waitingUsers, error: queueError } = await supabaseClient
      .from('queue')
      .select('user_id, status')
      .eq('status', 'waiting')
      .limit(10); // Get more than 2 to have options

    if (queueError) {
      console.error('Error fetching queue:', queueError);
      throw queueError;
    }

    console.log(`Found ${waitingUsers?.length || 0} waiting users`);

    // Need at least 2 users to make a match
    if (!waitingUsers || waitingUsers.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Not enough users in queue. Found ${waitingUsers?.length || 0} users, need at least 2.`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    // Randomly select 2 users
    const shuffled = [...waitingUsers].sort(() => 0.5 - Math.random());
    const user1 = shuffled[0];
    const user2 = shuffled[1];

    console.log(`Matching users: ${user1.user_id} and ${user2.user_id}`);

    // Create a new chat session
    const { data: newChat, error: chatError } = await supabaseClient
      .from('chats')
      .insert({
        user1_id: user1.user_id,
        user2_id: user2.user_id,
        messages: []
      })
      .select('chat_id')
      .single();

    if (chatError) {
      console.error('Error creating chat:', chatError);
      throw chatError;
    }

    console.log(`Created new chat: ${newChat.chat_id}`);

    // Update both users' queue status to 'matched'
    const { error: updateError1 } = await supabaseClient
      .from('queue')
      .update({ status: 'matched' })
      .eq('user_id', user1.user_id);

    const { error: updateError2 } = await supabaseClient
      .from('queue')
      .update({ status: 'matched' })
      .eq('user_id', user2.user_id);

    if (updateError1 || updateError2) {
      console.error('Error updating queue status:', updateError1 || updateError2);
      throw updateError1 || updateError2;
    }

    console.log('Successfully matched users and updated queue status');

    const result: MatchResult = {
      success: true,
      chat_id: newChat.chat_id,
      user1_id: user1.user_id,
      user2_id: user2.user_id,
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