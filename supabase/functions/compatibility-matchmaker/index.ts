import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompatibilityMatch {
  user_id: string;
  name: string;
  age: number;
  bio: string;
  photo_url: string;
  compatibility_score: number;
  compatibility_label: number;
  extroversion_diff: number;
  agreeableness_diff: number;
  age_diff: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Finding compatibility matches for user: ${user.id}`)

    // Check if user has completed compatibility test
    const { data: userScores, error: scoresError } = await supabaseClient
      .from('user_compatibility_scores')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (scoresError) {
      console.error('Error fetching user scores:', scoresError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user compatibility scores' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!userScores) {
      return new Response(
        JSON.stringify({ 
          error: 'Please complete the compatibility test first',
          needs_test: true 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseClient
      .from('users')
      .select('age, gender, preferences')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check and increment daily match usage
    const { data: matchLimitResult, error: limitError } = await supabaseClient
      .rpc('check_and_increment_match_usage', { p_user_id: user.id })

    if (limitError) {
      console.error('Error checking match limits:', limitError)
      return new Response(
        JSON.stringify({ error: 'Failed to check match limits' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!matchLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: matchLimitResult.message,
          limit_reached: true,
          current_usage: matchLimitResult.current_usage,
          daily_limit: matchLimitResult.daily_limit
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find potential matches with compatibility scores
    const { data: potentialMatches, error: matchesError } = await supabaseClient
      .from('users')
      .select(`
        id, name, age, bio, photo_url,
        user_compatibility_scores (
          extroversion_score, agreeableness_score, openness_to_experience_score,
          conscientiousness_score, neuroticism_score, directness_score
        )
      `)
      .neq('id', user.id)
      .not('user_compatibility_scores', 'is', null)

    if (matchesError) {
      console.error('Error fetching potential matches:', matchesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch potential matches' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Calculate compatibility for each potential match
    const compatibilityMatches: CompatibilityMatch[] = []

    for (const match of potentialMatches) {
      if (!match.user_compatibility_scores || match.user_compatibility_scores.length === 0) {
        continue
      }

      const matchScores = match.user_compatibility_scores[0]
      
      // Calculate compatibility using the same logic as our database function
      const extroversion_diff = Math.abs(userScores.extroversion_score - matchScores.extroversion_score)
      const agreeableness_diff = Math.abs(userScores.agreeableness_score - matchScores.agreeableness_score)
      const openness_diff = Math.abs(userScores.openness_to_experience_score - matchScores.openness_to_experience_score)
      const conscientiousness_diff = Math.abs(userScores.conscientiousness_score - matchScores.conscientiousness_score)
      const neuroticism_diff = Math.abs(userScores.neuroticism_score - matchScores.neuroticism_score)
      const directness_diff = Math.abs(userScores.directness_score - matchScores.directness_score)
      const age_diff = Math.abs(userProfile.age - match.age)

      // Calculate compatibility score (0-1, higher is better)
      const compatibility_score = 1.0 - (
        (extroversion_diff + agreeableness_diff + openness_diff + 
         conscientiousness_diff + neuroticism_diff + directness_diff) / 24.0 +
        Math.min(age_diff / 20.0, 1.0) * 0.2
      )

      // Determine compatibility label
      let compatibility_label = 0
      if ((extroversion_diff <= 1.5 && conscientiousness_diff <= 1.5 && age_diff <= 5) ||
          (agreeableness_diff <= 1.0 && neuroticism_diff <= 1.5 && age_diff <= 3)) {
        compatibility_label = 1
      }

      compatibilityMatches.push({
        user_id: match.id,
        name: match.name,
        age: match.age,
        bio: match.bio,
        photo_url: match.photo_url,
        compatibility_score: Math.round(compatibility_score * 1000) / 1000,
        compatibility_label,
        extroversion_diff: Math.round(extroversion_diff * 100) / 100,
        agreeableness_diff: Math.round(agreeableness_diff * 100) / 100,
        age_diff
      })
    }

    // Sort by compatibility score (highest first) and take top 10
    const topMatches = compatibilityMatches
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 10)

    console.log(`Found ${topMatches.length} compatibility matches for user ${user.id}`)

    // Store compatibility matches in database for future reference
    for (const match of topMatches) {
      await supabaseClient
        .from('user_compatibility_matches')
        .upsert({
          user1_id: user.id,
          user2_id: match.user_id,
          compatibility_score: match.compatibility_score,
          extroversion_diff: match.extroversion_diff,
          agreeableness_diff: match.agreeableness_diff,
          openness_to_experience_diff: 0, // Will be calculated by the full function
          conscientiousness_diff: 0,
          neuroticism_diff: 0,
          directness_diff: 0,
          age_diff: match.age_diff,
          compatibility_label: match.compatibility_label
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        matches: topMatches,
        total_found: topMatches.length,
        user_scores: userScores,
        message: 'Compatibility matches found successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in compatibility matchmaker:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})