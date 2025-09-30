-- Create user following/followers system for social networking

-- User follows table (who follows whom)
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent self-following and duplicate follows
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- User follow requests table (for private accounts)
CREATE TABLE IF NOT EXISTS public.follow_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent self-requests and duplicate requests
    CONSTRAINT no_self_request CHECK (requester_id != requested_id),
    UNIQUE(requester_id, requested_id)
);

-- User privacy settings
CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    allow_follow_requests BOOLEAN DEFAULT true,
    show_followers_count BOOLEAN DEFAULT true,
    show_following_count BOOLEAN DEFAULT true,
    show_activity_status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notification preferences for social features
CREATE TABLE IF NOT EXISTS public.social_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'new_follower',
        'follow_request',
        'follow_accepted',
        'story_view',
        'story_reaction',
        'mention',
        'post_like',
        'post_comment'
    )),
    actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_id UUID, -- Can be story_id, post_id, etc.
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate notifications
    UNIQUE(user_id, type, actor_id, target_id) WHERE target_id IS NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX idx_follow_requests_requester ON public.follow_requests(requester_id);
CREATE INDEX idx_follow_requests_requested ON public.follow_requests(requested_id);
CREATE INDEX idx_follow_requests_status ON public.follow_requests(status);
CREATE INDEX idx_social_notifications_user_unread ON public.social_notifications(user_id, is_read);
CREATE INDEX idx_social_notifications_created_at ON public.social_notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view public follows" ON public.user_follows
    FOR SELECT USING (
        -- Can see follows if target user is not private or if you follow them
        following_id IN (
            SELECT user_id FROM public.user_privacy_settings
            WHERE is_private = false
        ) OR
        following_id IN (
            SELECT following_id FROM public.user_follows
            WHERE follower_id = auth.uid()
        ) OR
        follower_id = auth.uid() OR
        following_id = auth.uid()
    );

CREATE POLICY "Users can create their own follows" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- RLS Policies for follow_requests
CREATE POLICY "Users can view their own follow requests" ON public.follow_requests
    FOR SELECT USING (
        auth.uid() = requester_id OR auth.uid() = requested_id
    );

CREATE POLICY "Users can create follow requests" ON public.follow_requests
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update requests directed to them" ON public.follow_requests
    FOR UPDATE USING (auth.uid() = requested_id);

CREATE POLICY "Users can delete their own requests" ON public.follow_requests
    FOR DELETE USING (
        auth.uid() = requester_id OR auth.uid() = requested_id
    );

-- RLS Policies for user_privacy_settings
CREATE POLICY "Users can view all privacy settings" ON public.user_privacy_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own privacy settings" ON public.user_privacy_settings
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for social_notifications
CREATE POLICY "Users can view their own notifications" ON public.social_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.social_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.social_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to get user followers count
CREATE OR REPLACE FUNCTION get_followers_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.user_follows
        WHERE following_id = target_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get user following count
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.user_follows
        WHERE follower_id = target_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower_user_id UUID, following_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM public.user_follows
        WHERE follower_id = follower_user_id
        AND following_id = following_user_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get mutual connections
CREATE OR REPLACE FUNCTION get_mutual_connections(user_a UUID, user_b UUID)
RETURNS TABLE(user_id UUID, name TEXT, photo_url TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.name,
        u.photo_url
    FROM public.users u
    WHERE u.id IN (
        -- Users that both A and B follow
        SELECT f1.following_id
        FROM public.user_follows f1
        WHERE f1.follower_id = user_a
        INTERSECT
        SELECT f2.following_id
        FROM public.user_follows f2
        WHERE f2.follower_id = user_b
    )
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest users to follow
CREATE OR REPLACE FUNCTION get_follow_suggestions(for_user_id UUID)
RETURNS TABLE(
    user_id UUID,
    name TEXT,
    photo_url TEXT,
    mutual_count INTEGER,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH user_communities AS (
        -- Get communities the user is in
        SELECT group_id
        FROM public.user_connections_groups
        WHERE user_id = for_user_id
    ),
    community_members AS (
        -- Get other members in those communities
        SELECT DISTINCT ucg.user_id
        FROM public.user_connections_groups ucg
        WHERE ucg.group_id IN (SELECT group_id FROM user_communities)
        AND ucg.user_id != for_user_id
        AND ucg.user_id NOT IN (
            -- Exclude already followed users
            SELECT following_id
            FROM public.user_follows
            WHERE follower_id = for_user_id
        )
    ),
    mutual_followers AS (
        -- Get users followed by people you follow
        SELECT
            uf2.following_id as suggested_user_id,
            COUNT(*) as mutual_count
        FROM public.user_follows uf1
        JOIN public.user_follows uf2 ON uf1.following_id = uf2.follower_id
        WHERE uf1.follower_id = for_user_id
        AND uf2.following_id != for_user_id
        AND uf2.following_id NOT IN (
            SELECT following_id
            FROM public.user_follows
            WHERE follower_id = for_user_id
        )
        GROUP BY uf2.following_id
    )
    SELECT
        u.id,
        u.name,
        u.photo_url,
        COALESCE(mf.mutual_count, 0)::INTEGER,
        CASE
            WHEN cm.user_id IS NOT NULL THEN 'In your communities'
            WHEN mf.mutual_count > 0 THEN 'Followed by people you follow'
            ELSE 'Suggested for you'
        END as reason
    FROM public.users u
    LEFT JOIN community_members cm ON u.id = cm.user_id
    LEFT JOIN mutual_followers mf ON u.id = mf.suggested_user_id
    WHERE (cm.user_id IS NOT NULL OR mf.suggested_user_id IS NOT NULL)
    ORDER BY
        COALESCE(mf.mutual_count, 0) DESC,
        u.created_at DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create notifications for new followers
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for the followed user
    INSERT INTO public.social_notifications (
        user_id,
        type,
        actor_id,
        content
    ) VALUES (
        NEW.following_id,
        'new_follower',
        NEW.follower_id,
        'started following you'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new follower notifications
CREATE TRIGGER trigger_notify_new_follower
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION notify_new_follower();

-- Initialize privacy settings for existing users
INSERT INTO public.user_privacy_settings (user_id, is_private)
SELECT id, false
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_privacy_settings)
ON CONFLICT (user_id) DO NOTHING;

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.follow_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_notifications;