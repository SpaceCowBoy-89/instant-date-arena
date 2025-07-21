import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client to verify user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user exists and get their ID
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log(`Starting account deletion for user: ${user.id}`)

    // Delete user data from custom tables first
    const deleteOperations = [
      supabaseAdmin.from('user_interactions').delete().eq('user_id', user.id),
      supabaseAdmin.from('user_match_limits').delete().eq('user_id', user.id),
      supabaseAdmin.from('queue').delete().eq('user_id', user.id),
      supabaseAdmin.from('chats').delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      supabaseAdmin.from('users').delete().eq('id', user.id)
    ]

    // Execute all delete operations
    const results = await Promise.allSettled(deleteOperations)
    
    // Log any failures but continue
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Delete operation ${index} failed:`, result.reason)
      }
    })

    // Delete the auth user using admin client
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteUserError) {
      console.error('Failed to delete auth user:', deleteUserError)
      throw deleteUserError
    }

    console.log(`Successfully deleted account for user: ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Delete account error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to delete account',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})