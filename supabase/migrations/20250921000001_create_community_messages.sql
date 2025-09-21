-- Create community_messages table for real-time group chat
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    community_id UUID NOT NULL REFERENCES public.connections_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX idx_community_messages_community_id ON public.community_messages(community_id);
CREATE INDEX idx_community_messages_created_at ON public.community_messages(created_at);
CREATE INDEX idx_community_messages_user_id ON public.community_messages(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see messages from communities they are members of
CREATE POLICY "Users can view messages from their communities" ON public.community_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_connections_groups
            WHERE user_id = auth.uid()
            AND group_id = community_messages.community_id
        )
    );

-- Create policy: Users can only insert messages to communities they are members of
CREATE POLICY "Users can send messages to their communities" ON public.community_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.user_connections_groups
            WHERE user_id = auth.uid()
            AND group_id = community_messages.community_id
        )
    );

-- Create policy: Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.community_messages
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy: Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.community_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Enable real-time subscriptions for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;