-- Create connections questions table
CREATE TABLE public.connections_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user connections answers table
CREATE TABLE public.user_connections_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.connections_questions(id),
  selected_answer JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create connections groups table
CREATE TABLE public.connections_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tag_name TEXT NOT NULL UNIQUE,
  tag_subtitle TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user connections groups table (many-to-many)
CREATE TABLE public.user_connections_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.connections_groups(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Create connections group messages table
CREATE TABLE public.connections_group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.connections_groups(id),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.connections_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_connections_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections_group_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connections_questions (public read)
CREATE POLICY "Anyone can view questions" 
ON public.connections_questions 
FOR SELECT 
USING (true);

-- RLS Policies for user_connections_answers
CREATE POLICY "Users can insert their own answers" 
ON public.user_connections_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own answers" 
ON public.user_connections_answers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers" 
ON public.user_connections_answers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for connections_groups (public read)
CREATE POLICY "Anyone can view groups" 
ON public.connections_groups 
FOR SELECT 
USING (true);

-- RLS Policies for user_connections_groups
CREATE POLICY "Users can insert their own group memberships" 
ON public.user_connections_groups 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view group memberships" 
ON public.user_connections_groups 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own group memberships" 
ON public.user_connections_groups 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for connections_group_messages
CREATE POLICY "Users can insert their own messages" 
ON public.connections_group_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view messages in groups they belong to" 
ON public.connections_group_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections_groups
    WHERE user_id = auth.uid() AND group_id = connections_group_messages.group_id
  )
);

-- Insert the predefined groups
INSERT INTO public.connections_groups (tag_name, tag_subtitle) VALUES
('funny', 'The Comedy Club - Where humor heals everything'),
('quirky', 'The Eccentrics - Beautifully weird and proud of it'),
('introspective', 'The Deep Thinkers - Philosophy over small talk'),
('relatable', 'The Real Ones - No pretense, just authenticity'),
('sassy', 'The Sass Squad - Confidence with a side of attitude'),
('thoughtful', 'The Kindred Spirits - Empathy and understanding'),
('sweet', 'The Heart Warmers - Spreading positivity everywhere'),
('flirty', 'The Charmers - Playful energy and good vibes'),
('romantic', 'The Dreamers - Believers in love and magic'),
('self-deprecating', 'The Humble Squad - Laughing at ourselves first'),
('absurd', 'The Wonderland Crew - Logic is overrated'),
('nerdy', 'The Brain Trust - Intelligence is attractive'),
('judgy', 'The Critics - Discerning taste in everything'),
('dark humor', 'The Dark Side - Humor from the shadows'),
('self-aware', 'The Conscious Collective - Know thyself'),
('wholesome', 'The Pure Hearts - Goodness in human form'),
('playful', 'The Fun Brigade - Life is a playground'),
('controversial', 'The Debate Club - Stirring the pot since forever'),
('awkward', 'The Beautifully Awkward - Embracing the cringe');

-- Create function to update user group based on answers
CREATE OR REPLACE FUNCTION public.update_user_connections_group()
RETURNS TRIGGER AS $$
DECLARE
  tag_counts JSONB;
  max_tag TEXT;
  max_count INT;
  tie_tags TEXT[];
  selected_group_id UUID;
BEGIN
  -- Calculate tag counts for the user
  SELECT jsonb_object_agg(tag, count) INTO tag_counts
  FROM (
    SELECT 
      tag,
      COUNT(*) as count
    FROM public.user_connections_answers uca
    CROSS JOIN LATERAL jsonb_array_elements_text(uca.selected_answer->'tags') AS tag
    WHERE uca.user_id = NEW.user_id
    GROUP BY tag
  ) tag_summary;

  -- Find the tag with maximum count
  SELECT tag, count INTO max_tag, max_count
  FROM jsonb_each_text(tag_counts)
  ORDER BY (value::INT) DESC
  LIMIT 1;

  -- Check for ties
  SELECT array_agg(key) INTO tie_tags
  FROM jsonb_each_text(tag_counts)
  WHERE value::INT = max_count;

  -- If there's a tie and user has answered less than 8 questions, wait for more answers
  IF array_length(tie_tags, 1) > 1 THEN
    -- Check if user has answered 8 or more questions
    IF (SELECT COUNT(*) FROM public.user_connections_answers WHERE user_id = NEW.user_id) >= 8 THEN
      -- Use the first tag in alphabetical order to break tie
      max_tag := tie_tags[1];
    ELSE
      -- Don't assign group yet, wait for more answers
      RETURN NEW;
    END IF;
  END IF;

  -- Get the group ID for the max tag
  SELECT id INTO selected_group_id
  FROM public.connections_groups
  WHERE tag_name = max_tag;

  -- Remove user from all existing groups
  DELETE FROM public.user_connections_groups
  WHERE user_id = NEW.user_id;

  -- Add user to the new group
  IF selected_group_id IS NOT NULL THEN
    INSERT INTO public.user_connections_groups (user_id, group_id)
    VALUES (NEW.user_id, selected_group_id)
    ON CONFLICT (user_id, group_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;