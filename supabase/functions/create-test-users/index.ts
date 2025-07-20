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

    // Get the current authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Initialize Supabase client with the user's auth token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Failed to get authenticated user: ' + (userError?.message || 'No user found'));
    }

    console.log('Current user:', user.id);

    // Initialize Supabase admin client for user creation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate unique identifiers to avoid duplicates
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    
    // Check existing users to ensure no duplicates
    const { data: existingUsers } = await supabaseAdmin
      .from('users')
      .select('name, id')
      .limit(1000);
    
    const existingNames = new Set(existingUsers?.map(u => u.name) || []);
    
    // Generate unique female test users with unique names
    const femaleNames = [
      'Emma Johnson', 'Olivia Martinez', 'Sophia Chen', 'Isabella Rodriguez', 
      'Ava Thompson', 'Mia Davis', 'Charlotte Wilson', 'Amelia Brown', 
      'Harper Garcia', 'Evelyn Miller', 'Luna Singh', 'Nova Williams',
      'Zoe Taylor', 'Chloe Anderson', 'Lily Moore', 'Grace Jackson',
      'Ella White', 'Scarlett Harris', 'Victoria Clark', 'Aria Lewis',
      'Maya Robinson', 'Layla Walker', 'Riley Hall', 'Zoey Allen',
      'Nora Young', 'Hazel King', 'Elena Wright', 'Claire Lopez',
      'Savannah Hill', 'Audrey Green', 'Brooklyn Adams', 'Bella Baker',
      'Skylar Gonzalez', 'Leah Nelson', 'Paisley Carter', 'Natalie Mitchell',
      'Kennedy Perez', 'Naomi Roberts', 'Allison Turner', 'Gabriella Phillips',
      'Anna Campbell', 'Samantha Parker', 'Sarah Evans', 'Hailey Edwards',
      'Ryleigh Collins', 'Ivy Stewart', 'Jade Sanchez', 'Lila Morris',
      'Melody Rogers', 'Julia Reed', 'Athena Cook', 'Maria Bailey',
      'Bianca Rivera', 'Lola Cooper', 'Vivian Richardson', 'Ruby Cox',
      'Evangeline Ward', 'Iris Torres', 'Emery Peterson', 'Rosalie Gray',
      'Sloane Ramirez', 'Callie James', 'Quinn Watson', 'Paige Brooks',
      'Delilah Kelly', 'Elise Sanders', 'Fiona Price', 'Tessa Bennett',
      'Catalina Wood', 'Sienna Barnes', 'Daniela Ross', 'Cecilia Henderson',
      'Valeria Coleman', 'Alicia Jenkins', 'Maggie Perry', 'Reagan Powell',
      'Lucille Long', 'Delaney Patterson', 'Kaia Hughes', 'Nyla Flores',
      'Alessandra Washington', 'Camille Butler', 'Presley Simmons',
      'Adelaide Foster', 'Josephine Gonzales', 'Ruth Bryant', 'Genevieve Alexander',
      'Vera Russell', 'Francesca Griffin', 'Arabella Diaz', 'Juniper Hayes'
    ];
    
    const locations = [
      'San Francisco, CA', 'Austin, TX', 'Portland, OR', 'Seattle, WA',
      'Denver, CO', 'Nashville, TN', 'Miami, FL', 'Chicago, IL'
    ];
    
    const bios = [
      'Love hiking and photography. Always up for new adventures!',
      'Yoga instructor and coffee enthusiast. Looking for genuine connections.',
      'Artist and bookworm. Love exploring local galleries and cozy cafes.',
      'Food blogger and travel lover. Seeking someone to share culinary adventures.',
      'Fitness enthusiast and dog mom. Looking for an active partner.',
      'Music lover and concert goer. Let\'s discover new bands together!',
      'Environmental scientist passionate about sustainability and nature.',
      'Teacher who loves weekend getaways and trying new restaurants.'
    ];
    
    const photoUrls = [
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=400&h=400&fit=crop&crop=face'
    ];
    
    // Create 3 unique users with guaranteed unique names
    const testUsers = [];
    const shuffledNames = [...femaleNames].sort(() => Math.random() - 0.5); // Shuffle the names
    
    for (let i = 0; i < 3; i++) {
      // Pick the next available unique name that doesn't exist in database
      let selectedName = null;
      for (const name of shuffledNames) {
        if (!existingNames.has(name)) {
          selectedName = name;
          existingNames.add(name); // Mark as used for this batch
          break;
        }
      }
      
      // Fallback if somehow all names are taken (very unlikely)
      if (!selectedName) {
        selectedName = `User${timestamp}${randomId}${i}`;
      }
      
      const user = {
        name: selectedName,
        email: `${selectedName.toLowerCase().replace(/\s+/g, '')}${timestamp}${randomId}${i}@demo.com`,
        password: 'demo123',
        age: 22 + Math.floor(Math.random() * 8), // Ages 22-29
        location: locations[Math.floor(Math.random() * locations.length)],
        bio: bios[Math.floor(Math.random() * bios.length)],
        photo_url: photoUrls[Math.floor(Math.random() * photoUrls.length)],
        preferences: { 
          interests: ['fitness', 'travel', 'food', 'art', 'music'].slice(0, 2 + Math.floor(Math.random() * 2)),
          ageRange: [25, 35] 
        }
      };
      
      testUsers.push(user);
    }

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
          gender: 'Female',
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

    // Create matches with the current logged in user
    const currentUserId = user.id;
    const successfulUsers = results.filter(r => r.success);
    
    console.log(`Creating matches between current user (${currentUserId}) and ${successfulUsers.length} users`);

    for (const user of successfulUsers) {
      const matchMessages = [
        {
          id: `match_${Date.now()}_1`,
           text: `Hey ${user.name.split(' ')[0]}! We've been matched! 😊`,
           sender_id: currentUserId,
          timestamp: new Date().toISOString()
        },
        {
          id: `match_${Date.now()}_2`,
          text: "Hi! Nice to meet you! I'm excited to chat 💬",
          sender_id: user.userId,
          timestamp: new Date(Date.now() + 60000).toISOString()
        }
      ];

      const { error: chatError } = await supabaseAdmin
        .from('chats')
         .insert({
           user1_id: currentUserId,
           user2_id: user.userId,
          messages: matchMessages
        });

      if (chatError) {
        console.error(`Error creating chat with ${user.name}:`, chatError);
      } else {
        console.log(`Created match between current user and ${user.name}`);
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