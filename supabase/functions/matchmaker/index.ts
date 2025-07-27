
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

    // Get current user's profile for gender preferences
    const { data: currentUserProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('gender, preferences')
      .eq('id', user.id)
      .single();

    if (profileError || !currentUserProfile) {
      console.error('Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching user profile' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userGender = currentUserProfile.gender;
    const userGenderPreference = currentUserProfile.preferences?.gender_preference;

    console.log(`User gender: ${userGender}, preference: ${userGenderPreference}`);

    if (!userGender || !userGenderPreference) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Please complete your profile with gender and preferences before matching' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

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

    // Get users that this user has already rejected
    const { data: rejectedUsers, error: rejectError } = await supabaseClient
      .from('user_interactions')
      .select('target_user_id')
      .eq('user_id', user.id)
      .eq('interaction_type', 'reject');

    if (rejectError) {
      console.error('Error fetching rejected users:', rejectError);
    }

    const rejectedUserIds = rejectedUsers?.map(r => r.target_user_id) || [];

    // Get compatible waiting users with gender preference filtering
    console.log(`Looking for users with gender: ${userGenderPreference}, who prefer: ${userGender}`);
    
    // First get all waiting users from queue (excluding current user and rejected users)
    let queueQuery = supabaseClient
      .from('queue')
      .select('user_id, status')
      .eq('status', 'waiting')
      .neq('user_id', user.id);

    // Exclude rejected users if any exist
    if (rejectedUserIds.length > 0) {
      queueQuery = queueQuery.not('user_id', 'in', `(${rejectedUserIds.join(',')})`);
    }

    const { data: queueUsers, error: queueError } = await queueQuery;

    if (queueError) {
      console.error('Error fetching queue users:', queueError);
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

    console.log(`Found ${queueUsers?.length || 0} waiting users (excluding current user)`);

    if (!queueUsers || queueUsers.length === 0) {
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

    // Get user profiles for those in queue
    const userIds = queueUsers.map(q => q.user_id);
    const { data: userProfiles, error: profilesError } = await supabaseClient
      .from('users')
      .select('id, gender, preferences')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error fetching user profiles' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter by gender preferences for mutual compatibility
    const compatibleUsers = queueUsers?.filter(queueUser => {
      const userProfile = userProfiles?.find(p => p.id === queueUser.user_id);
      if (!userProfile) return false;

      const otherUserGender = userProfile.gender;
      const otherUserGenderPreference = userProfile.preferences?.gender_preference;
      
      // Check mutual compatibility:
      // 1. Other user's gender matches current user's preference
      // 2. Other user's preference matches current user's gender
      // Handle both "Male"/"Men" and "Female"/"Women" variations
      const normalizeGender = (gender: string) => {
        if (!gender) return '';
        const lower = gender.toLowerCase();
        if (lower === 'male' || lower === 'men') return 'male';
        if (lower === 'female' || lower === 'women') return 'female';
        return lower;
      };
      
      const normalizedOtherGender = normalizeGender(otherUserGender);
      const normalizedUserPreference = normalizeGender(userGenderPreference);
      const normalizedOtherPreference = normalizeGender(otherUserGenderPreference);
      const normalizedUserGender = normalizeGender(userGender);
      
      const isCompatible = normalizedOtherGender === normalizedUserPreference && 
                          normalizedOtherPreference === normalizedUserGender;
      
      console.log(`User ${queueUser.user_id}: gender=${otherUserGender}, prefers=${otherUserGenderPreference}, compatible=${isCompatible}`);
      
      return isCompatible;
    }) || [];

    console.log(`Found ${compatibleUsers.length} compatible users`);

    // Check if we have a compatible user waiting
    if (compatibleUsers.length < 1) {
      // No compatible match found, user stays in queue
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No compatible users available for matching. You will remain in the queue.' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get a random compatible user
    const randomIndex = Math.floor(Math.random() * compatibleUsers.length);
    const otherUser = compatibleUsers[randomIndex];

    console.log(`Matching users: ${user.id} and ${otherUser.user_id}`);

    // Create a new chat session with synchronized timer
    const timerStartTime = new Date().toISOString();
    const { data: newChat, error: chatError } = await supabaseClient
      .from('chats')
      .insert({
        user1_id: user.id,
        user2_id: otherUser.user_id,
        messages: [],
        temporary_messages: [],
        timer_start_time: timerStartTime
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
