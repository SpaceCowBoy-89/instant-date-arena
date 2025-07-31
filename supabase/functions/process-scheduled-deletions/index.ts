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

    console.log('Processing scheduled account deletions...')

    // Find accounts scheduled for deletion that are past their deletion date
    const { data: scheduledDeletions, error: fetchError } = await supabaseAdmin
      .from('account_deletion_requests')
      .select(`
        *,
        users!inner(id, name, email)
      `)
      .eq('status', 'pending')
      .lte('scheduled_deletion_at', new Date().toISOString())
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('Error fetching scheduled deletions:', fetchError)
      throw fetchError
    }

    if (!scheduledDeletions || scheduledDeletions.length === 0) {
      console.log('No accounts scheduled for deletion at this time')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No accounts scheduled for deletion',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const processedDeletions = []

    // Process each deletion
    for (const deletion of scheduledDeletions) {
      const userId = deletion.user_id
      
      try {
        console.log(`Processing deletion for user: ${userId}`)

        // Delete user data from custom tables first
        const deleteOperations = [
          supabaseAdmin.from('user_interactions').delete().eq('user_id', userId),
          supabaseAdmin.from('user_match_limits').delete().eq('user_id', userId),
          supabaseAdmin.from('queue').delete().eq('user_id', userId),
          supabaseAdmin.from('chats').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
          supabaseAdmin.from('blocked_users').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`),
          supabaseAdmin.from('user_reports').delete().or(`reporter_id.eq.${userId},reported_user_id.eq.${userId}`),
          supabaseAdmin.from('user_verifications').delete().eq('user_id', userId),
          supabaseAdmin.from('user_connections_answers').delete().eq('user_id', userId),
          supabaseAdmin.from('user_connections_groups').delete().eq('user_id', userId),
          supabaseAdmin.from('connections_group_messages').delete().eq('user_id', userId),
          supabaseAdmin.from('users').delete().eq('id', userId)
        ]

        // Execute all delete operations
        const results = await Promise.allSettled(deleteOperations)
        
        // Log any failures but continue
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`Delete operation ${index} failed for user ${userId}:`, result.reason)
          }
        })

        // Delete the auth user using admin client
        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteUserError) {
          console.error(`Failed to delete auth user ${userId}:`, deleteUserError)
          // Mark as failed but continue with others
          await supabaseAdmin
            .from('account_deletion_requests')
            .update({ 
              status: 'failed',
              notes: `Auth deletion failed: ${deleteUserError.message}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', deletion.id)
        } else {
          // Mark deletion as completed
          await supabaseAdmin
            .from('account_deletion_requests')
            .update({ 
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', deletion.id)

          console.log(`Successfully deleted account for user: ${userId}`)
          processedDeletions.push(userId)
        }

      } catch (error) {
        console.error(`Error processing deletion for user ${userId}:`, error)
        
        // Mark deletion as failed
        await supabaseAdmin
          .from('account_deletion_requests')
          .update({ 
            status: 'failed',
            notes: `Processing failed: ${error.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', deletion.id)
      }
    }

    console.log(`Processed ${processedDeletions.length} account deletions`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${processedDeletions.length} scheduled deletions`,
        processed: processedDeletions.length,
        total_found: scheduledDeletions.length,
        deleted_users: processedDeletions
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Process scheduled deletions error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process scheduled deletions',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})