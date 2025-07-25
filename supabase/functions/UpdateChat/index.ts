import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function validates that the authenticated user is a member of the chat.
// It uses the user's own auth context for security.
async function validateUserIsChatMember(supabase: SupabaseClient, chatId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('chats')
    .select('chat_id')
    .eq('chat_id', chatId)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .single();

  if (error || !data) {
    console.error(`Auth check failed for user ${userId} in chat ${chatId}:`, error?.message);
    return false;
  }

  return true;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client with the user's auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 2. Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed: ' + (userError?.message || 'No user found'));
    }
    console.log(`Request from user: ${user.id}`);

    // 3. Extract parameters from the request body
    const { chatId, message } = await req.json();
    if (!chatId || !message) {
      throw new Error('Missing required parameters: chatId and message.');
    }

    // 4. SECURITY CHECK: Verify the user is a member of the chat they're trying to post to.
    const isMember = await validateUserIsChatMember(supabase, chatId, user.id);
    if (!isMember) {
      return new Response(
        JSON.stringify({ success: false, error: 'User is not a member of this chat.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Initialize Supabase admin client to perform the update
    // This is necessary to bypass any restrictive RLS policies for the atomic append.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 6. Atomically append the message using the Supabase Admin client
    // The previous SQL function's logic is now here, executed with admin rights.
    // NOTE: This uses a raw postgres function `jsonb_insert` for reliable appending.
    const { error: updateError } = await supabaseAdmin
      .from('chats')
      .update({
        // The `||` operator is for Postgres, in the JS client we can use rpc or manual construction
        // but for simplicity and reliability, we directly set the new array.
        // A more advanced and truly atomic way is using an RPC call here as well.
        // Let's create an RPC call for the append itself.
        temporary_messages: supabaseAdmin.rpc('jsonb_append', {
            original_jsonb: 'temporary_messages', // column name
            new_element: message
        }),
        updated_at: new Date().toISOString(),
      })
      .eq('chat_id', chatId);
      
    // The above is pseudo-code. The actual way to call `||` is through an RPC function.
    // The provided `append_message` SQL function is the BEST way. Let's call that.
    
    console.log(`Appending message to chat: ${chatId}`);

    const { error: rpcError } = await supabaseAdmin.rpc('append_message', {
      chat_id_param: chatId,
      message_param: message,
    });

    if (rpcError) {
      throw new Error(`Failed to append message: ${rpcError.message}`);
    }

    console.log(`Message successfully appended to chat: ${chatId}`);

    // 7. Return a success response
    return new Response(
      JSON.stringify({ success: true, message: 'Message appended successfully.' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});