-- Create stories system for 24-hour disappearing content
-- Stories are temporary posts that auto-delete after 24 hours

-- Stories table
CREATE TABLE IF NOT EXISTS public.user_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('image', 'video', 'text')),
    media_url TEXT, -- URL for image/video content
    text_content TEXT, -- For text-only stories
    background_color VARCHAR(7), -- Hex color for text stories (#FF0000)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + INTERVAL '24 hours') NOT NULL,
    is_active BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,

    -- Story customization
    text_size VARCHAR(10) DEFAULT 'medium' CHECK (text_size IN ('small', 'medium', 'large')),
    text_alignment VARCHAR(10) DEFAULT 'center' CHECK (text_alignment IN ('left', 'center', 'right')),

    -- Privacy settings
    visibility VARCHAR(20) DEFAULT 'followers' CHECK (visibility IN ('public', 'followers', 'close_friends', 'private')),

    -- Constraints
    CONSTRAINT valid_content CHECK (
        (content_type = 'text' AND text_content IS NOT NULL) OR
        (content_type IN ('image', 'video') AND media_url IS NOT NULL)
    )
);

-- Story views tracking
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate views
    UNIQUE(story_id, viewer_id)
);

-- Story reactions (using existing emoji reactions system)
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- One reaction per user per story
    UNIQUE(story_id, user_id, emoji)
);

-- Story highlights (permanent collections)
CREATE TABLE IF NOT EXISTS public.story_highlights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    cover_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Junction table for stories in highlights
CREATE TABLE IF NOT EXISTS public.highlight_stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    highlight_id UUID NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate stories in same highlight
    UNIQUE(highlight_id, story_id)
);

-- Indexes for performance
CREATE INDEX idx_user_stories_user_id ON public.user_stories(user_id);
CREATE INDEX idx_user_stories_expires_at ON public.user_stories(expires_at);
CREATE INDEX idx_user_stories_active ON public.user_stories(is_active) WHERE is_active = true;
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_reactions_story_id ON public.story_reactions(story_id);

-- Enable Row Level Security
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlight_stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stories
CREATE POLICY "Users can view active stories based on visibility" ON public.user_stories
    FOR SELECT USING (
        is_active = true AND
        expires_at > now() AND
        (
            visibility = 'public' OR
            (visibility = 'followers' AND user_id IN (
                SELECT following_id FROM public.user_follows WHERE follower_id = auth.uid()
            )) OR
            user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own stories" ON public.user_stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON public.user_stories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.user_stories
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for story_views
CREATE POLICY "Users can view story views for their own stories" ON public.story_views
    FOR SELECT USING (
        story_id IN (SELECT id FROM public.user_stories WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create story views" ON public.story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- RLS Policies for story_reactions
CREATE POLICY "Users can view story reactions" ON public.story_reactions
    FOR SELECT USING (true);

CREATE POLICY "Users can create story reactions" ON public.story_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story reactions" ON public.story_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-delete expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    -- Mark expired stories as inactive
    UPDATE public.user_stories
    SET is_active = false
    WHERE expires_at <= now() AND is_active = true;

    -- Optionally delete expired stories completely after 30 days
    DELETE FROM public.user_stories
    WHERE expires_at <= (now() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Function to get user's active stories
CREATE OR REPLACE FUNCTION get_user_stories(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    content_type VARCHAR,
    media_url TEXT,
    text_content TEXT,
    background_color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER,
    has_viewed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.content_type,
        s.media_url,
        s.text_content,
        s.background_color,
        s.created_at,
        s.expires_at,
        s.view_count,
        EXISTS(
            SELECT 1 FROM public.story_views
            WHERE story_id = s.id AND viewer_id = auth.uid()
        ) as has_viewed
    FROM public.user_stories s
    WHERE s.user_id = target_user_id
    AND s.is_active = true
    AND s.expires_at > now()
    ORDER BY s.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;