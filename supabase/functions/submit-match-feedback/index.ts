import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MatchFeedbackRequest {
  user_id: string;
  match_id: string;
  rating: number;
  comment?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, match_id, rating, comment }: MatchFeedbackRequest = await req.json();

    // Validate required fields
    if (!user_id || !match_id || rating === undefined || rating === null) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, match_id, and rating are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate rating range (1-5 stars)
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return new Response(
        JSON.stringify({ error: "Rating must be an integer between 1 and 5" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify the user exists
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "Invalid user_id" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if feedback already exists for this user-match pair
    const { data: existingFeedback, error: checkError } = await supabaseClient
      .from('match_feedback')
      .select('id')
      .eq('user_id', user_id)
      .eq('match_id', match_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing feedback:", checkError);
      return new Response(
        JSON.stringify({ error: "Database error while checking existing feedback" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let result;

    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabaseClient
        .from('match_feedback')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .eq('match_id', match_id)
        .select()
        .single();

      if (error) {
        console.error("Error updating feedback:", error);
        return new Response(
          JSON.stringify({ error: "Failed to update feedback" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      result = data;
    } else {
      // Insert new feedback
      const { data, error } = await supabaseClient
        .from('match_feedback')
        .insert({
          user_id,
          match_id,
          rating,
          comment: comment || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting feedback:", error);
        return new Response(
          JSON.stringify({ error: "Failed to save feedback" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      result = data;
    }

    console.log(`Feedback ${existingFeedback ? 'updated' : 'created'} for user ${user_id}, match ${match_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Feedback submitted successfully",
        feedback: result
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in submit-match-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);