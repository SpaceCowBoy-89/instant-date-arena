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
    console.log('Creating test users...');

    // Initialize Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique emails using timestamp to avoid duplicates
    const timestamp = Date.now();
    const testUsers = [
      {
        name: 'Jane Smith',
        email: `jsmith${timestamp}@gmail.com`,
        password: 'smith123',
        age: 24,
        location: 'San Francisco, CA',
        bio: 'Love hiking and photography. Always up for new adventures!',
        photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
        preferences: { interests: ['hiking', 'photography', 'travel'], ageRange: [22, 30] }
      },
      {
        name: 'Jessica Sams',
        email: `jsams${timestamp}@gmail.com`,
        password: 'sams123',
        age: 22,
        location: 'Austin, TX',
        bio: 'Yoga instructor and coffee enthusiast. Looking for genuine connections.',
        photo_url: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
        preferences: { interests: ['yoga', 'coffee', 'wellness'], ageRange: [20, 28] }
      },
      {
        name: 'Jordan Kelley',
        email: `jkelley${timestamp}@gmail.com`,
        password: 'kelley123',
        age: 26,
        location: 'Portland, OR',
        bio: 'Artist and bookworm. Love exploring local galleries and cozy cafes.',
        photo_url: 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=400&fit=crop&crop=face',
        preferences: { interests: ['art', 'reading', 'museums'], ageRange: [24, 32] }
      }
    ];

    const results = [];

    for (const userData of testUsers) {
      console.log(`Creating user: ${userData.name}`);
      
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      });

      if (authError) {
        console.error(`Error creating auth user ${userData.name}:`, authError);
        results.push({ 
          name: userData.name, 
          success: false, 
          error: authError.message 
        });
        continue;
      }

      console.log(`Auth user created for ${userData.name}, ID: ${authData.user.id}`);

      // Create profile in users table
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          name: userData.name,
          gender: 'female',
          age: userData.age,
          location: userData.location,
          bio: userData.bio,
          photo_url: userData.photo_url,
          preferences: userData.preferences
        });

      if (profileError) {
        console.error(`Error creating profile for ${userData.name}:`, profileError);
        results.push({ 
          name: userData.name, 
          success: false, 
          error: profileError.message 
        });
      } else {
        console.log(`Profile created successfully for ${userData.name}`);
        results.push({ 
          name: userData.name, 
          success: true, 
          userId: authData.user.id 
        });
      }
    }

    // Create matches with Christopher Wallace
    const christopherUserId = '0f54ba57-1aaf-46db-8862-2f967ad64a1b';
    const successfulUsers = results.filter(r => r.success);
    
    console.log(`Creating matches between Christopher and ${successfulUsers.length} users`);

    for (const user of successfulUsers) {
      const matchMessages = [
        {
          id: `match_${Date.now()}_1`,
          text: `Hey ${user.name.split(' ')[0]}! We've been matched! 😊`,
          sender_id: christopherUserId,
          timestamp: new Date().toISOString()
        },
        {
          id: `match_${Date.now()}_2`,
          text: "Hi Christopher! Nice to meet you! I'm excited to chat 💬",
          sender_id: user.userId,
          timestamp: new Date(Date.now() + 60000).toISOString()
        }
      ];

      const { error: chatError } = await supabaseAdmin
        .from('chats')
        .insert({
          user1_id: christopherUserId,
          user2_id: user.userId,
          messages: matchMessages
        });

      if (chatError) {
        console.error(`Error creating chat with ${user.name}:`, chatError);
      } else {
        console.log(`Created match between Christopher and ${user.name}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test users creation completed',
        results 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});