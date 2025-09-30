import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Clean up expired stories
    const { data: expiredStories, error: fetchError } = await supabaseClient
      .from('user_stories')
      .select('id, media_url')
      .lte('expires_at', new Date().toISOString())
      .eq('is_active', true)

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${expiredStories?.length || 0} expired stories to clean up`)

    if (expiredStories && expiredStories.length > 0) {
      // Delete media files from storage
      for (const story of expiredStories) {
        if (story.media_url) {
          try {
            // Extract file path from URL
            const url = new URL(story.media_url)
            const pathParts = url.pathname.split('/')
            const bucket = pathParts[pathParts.length - 2] // stories
            const fileName = pathParts[pathParts.length - 1]
            const filePath = `stories/${fileName}`

            // Delete from storage
            const { error: deleteError } = await supabaseClient.storage
              .from('media')
              .remove([filePath])

            if (deleteError) {
              console.error(`Failed to delete media file ${filePath}:`, deleteError)
            } else {
              console.log(`Deleted media file: ${filePath}`)
            }
          } catch (error) {
            console.error(`Error processing media URL ${story.media_url}:`, error)
          }
        }
      }

      // Mark stories as inactive (soft delete)
      const { error: updateError } = await supabaseClient
        .from('user_stories')
        .update({ is_active: false })
        .lte('expires_at', new Date().toISOString())
        .eq('is_active', true)

      if (updateError) {
        throw updateError
      }

      console.log(`Marked ${expiredStories.length} stories as inactive`)

      // Delete stories completely after 30 days (hard delete for privacy)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error: deleteError } = await supabaseClient
        .from('user_stories')
        .delete()
        .lte('expires_at', thirtyDaysAgo.toISOString())

      if (deleteError) {
        throw deleteError
      }

      console.log('Deleted stories older than 30 days')
    }

    // Clean up orphaned story views and reactions
    const { error: cleanupViewsError } = await supabaseClient
      .rpc('cleanup_orphaned_story_data')

    if (cleanupViewsError) {
      console.error('Error cleaning up orphaned story data:', cleanupViewsError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: expiredStories?.length || 0,
        message: 'Story cleanup completed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Story cleanup error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})