-- Create compatibility questions table
CREATE TABLE public.compatibility_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_text TEXT NOT NULL,
  trait_category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user compatibility answers table
CREATE TABLE public.user_compatibility_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL,
  answer_value INTEGER NOT NULL CHECK (answer_value >= 1 AND answer_value <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Create user compatibility scores table
CREATE TABLE public.user_compatibility_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  extroversion_score DECIMAL(3,2),
  agreeableness_score DECIMAL(3,2),
  openness_to_experience_score DECIMAL(3,2),
  conscientiousness_score DECIMAL(3,2),
  neuroticism_score DECIMAL(3,2),
  directness_score DECIMAL(3,2),
  emotional_intelligence_score DECIMAL(3,2),
  communication_style_score DECIMAL(3,2),
  flexibility_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user compatibility matches table
CREATE TABLE public.user_compatibility_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  compatibility_score DECIMAL(4,3),
  extroversion_diff DECIMAL(3,2),
  agreeableness_diff DECIMAL(3,2),
  openness_to_experience_diff DECIMAL(3,2),
  conscientiousness_diff DECIMAL(3,2),
  neuroticism_diff DECIMAL(3,2),
  directness_diff DECIMAL(3,2),
  age_diff INTEGER,
  compatibility_label INTEGER CHECK (compatibility_label IN (0, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Enable Row Level Security
ALTER TABLE public.compatibility_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_compatibility_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_compatibility_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for compatibility_questions
CREATE POLICY "Anyone can view compatibility questions" 
ON public.compatibility_questions 
FOR SELECT 
USING (true);

-- Create policies for user_compatibility_answers
CREATE POLICY "Users can view their own answers" 
ON public.user_compatibility_answers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own answers" 
ON public.user_compatibility_answers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own answers" 
ON public.user_compatibility_answers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policies for user_compatibility_scores
CREATE POLICY "Users can view their own scores" 
ON public.user_compatibility_scores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view all scores for matching" 
ON public.user_compatibility_scores 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert/update scores" 
ON public.user_compatibility_scores 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create policies for user_compatibility_matches
CREATE POLICY "Users can view their own matches" 
ON public.user_compatibility_matches 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can create matches" 
ON public.user_compatibility_matches 
FOR INSERT 
WITH CHECK (true);

-- Insert the 15 compatibility questions
INSERT INTO public.compatibility_questions (question_text, trait_category) VALUES
('I am the life of the party.', 'extroversion'),
('I feel comfortable around people.', 'extroversion'),
('I am deeply compassionate and empathetic.', 'agreeableness'),
('I think of others before myself.', 'agreeableness'),
('I enjoy trying new and exotic foods.', 'openness_to_experience'),
('I have a vivid imagination.', 'openness_to_experience'),
('I pay attention to details and am very organized.', 'conscientiousness'),
('I always finish what I start.', 'conscientiousness'),
('I worry about things often.', 'neuroticism'),
('I get stressed out easily.', 'neuroticism'),
('I prefer to get straight to the point in conversations.', 'directness'),
('I believe in being brutally honest rather than sugar-coating things.', 'directness'),
('I can easily tell how someone is feeling just by looking at their face.', 'emotional_intelligence'),
('I am a better listener than a talker.', 'communication_style'),
('My plans often change, and I am fine with that.', 'flexibility');

-- Function to calculate compatibility scores
CREATE OR REPLACE FUNCTION public.calculate_compatibility_scores(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_extroversion DECIMAL(3,2);
  v_agreeableness DECIMAL(3,2);
  v_openness DECIMAL(3,2);
  v_conscientiousness DECIMAL(3,2);
  v_neuroticism DECIMAL(3,2);
  v_directness DECIMAL(3,2);
  v_emotional_intelligence DECIMAL(3,2);
  v_communication_style DECIMAL(3,2);
  v_flexibility DECIMAL(3,2);
BEGIN
  -- Calculate trait scores by averaging answers for each category
  SELECT AVG(uca.answer_value) INTO v_extroversion
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'extroversion';

  SELECT AVG(uca.answer_value) INTO v_agreeableness
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'agreeableness';

  SELECT AVG(uca.answer_value) INTO v_openness
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'openness_to_experience';

  SELECT AVG(uca.answer_value) INTO v_conscientiousness
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'conscientiousness';

  SELECT AVG(uca.answer_value) INTO v_neuroticism
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'neuroticism';

  SELECT AVG(uca.answer_value) INTO v_directness
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'directness';

  SELECT AVG(uca.answer_value) INTO v_emotional_intelligence
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'emotional_intelligence';

  SELECT AVG(uca.answer_value) INTO v_communication_style
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'communication_style';

  SELECT AVG(uca.answer_value) INTO v_flexibility
  FROM public.user_compatibility_answers uca
  JOIN public.compatibility_questions cq ON uca.question_id = cq.id
  WHERE uca.user_id = p_user_id AND cq.trait_category = 'flexibility';

  -- Insert or update the scores
  INSERT INTO public.user_compatibility_scores (
    user_id, extroversion_score, agreeableness_score, openness_to_experience_score,
    conscientiousness_score, neuroticism_score, directness_score,
    emotional_intelligence_score, communication_style_score, flexibility_score
  ) VALUES (
    p_user_id, v_extroversion, v_agreeableness, v_openness,
    v_conscientiousness, v_neuroticism, v_directness,
    v_emotional_intelligence, v_communication_style, v_flexibility
  )
  ON CONFLICT (user_id) DO UPDATE SET
    extroversion_score = EXCLUDED.extroversion_score,
    agreeableness_score = EXCLUDED.agreeableness_score,
    openness_to_experience_score = EXCLUDED.openness_to_experience_score,
    conscientiousness_score = EXCLUDED.conscientiousness_score,
    neuroticism_score = EXCLUDED.neuroticism_score,
    directness_score = EXCLUDED.directness_score,
    emotional_intelligence_score = EXCLUDED.emotional_intelligence_score,
    communication_style_score = EXCLUDED.communication_style_score,
    flexibility_score = EXCLUDED.flexibility_score,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate compatibility between two users
CREATE OR REPLACE FUNCTION public.calculate_user_compatibility(p_user1_id UUID, p_user2_id UUID)
RETURNS JSONB AS $$
DECLARE
  u1_scores RECORD;
  u2_scores RECORD;
  u1_age INTEGER;
  u2_age INTEGER;
  extroversion_diff DECIMAL(3,2);
  agreeableness_diff DECIMAL(3,2);
  openness_diff DECIMAL(3,2);
  conscientiousness_diff DECIMAL(3,2);
  neuroticism_diff DECIMAL(3,2);
  directness_diff DECIMAL(3,2);
  age_diff INTEGER;
  compatibility_score DECIMAL(4,3);
  compatibility_label INTEGER;
BEGIN
  -- Get scores for both users
  SELECT * INTO u1_scores FROM public.user_compatibility_scores WHERE user_id = p_user1_id;
  SELECT * INTO u2_scores FROM public.user_compatibility_scores WHERE user_id = p_user2_id;
  
  -- Get ages
  SELECT age INTO u1_age FROM public.users WHERE id = p_user1_id;
  SELECT age INTO u2_age FROM public.users WHERE id = p_user2_id;
  
  -- Return null if either user hasn't completed the test
  IF u1_scores IS NULL OR u2_scores IS NULL OR u1_age IS NULL OR u2_age IS NULL THEN
    RETURN jsonb_build_object('error', 'One or both users have not completed compatibility test or profile');
  END IF;
  
  -- Calculate differences
  extroversion_diff := ABS(u1_scores.extroversion_score - u2_scores.extroversion_score);
  agreeableness_diff := ABS(u1_scores.agreeableness_score - u2_scores.agreeableness_score);
  openness_diff := ABS(u1_scores.openness_to_experience_score - u2_scores.openness_to_experience_score);
  conscientiousness_diff := ABS(u1_scores.conscientiousness_score - u2_scores.conscientiousness_score);
  neuroticism_diff := ABS(u1_scores.neuroticism_score - u2_scores.neuroticism_score);
  directness_diff := ABS(u1_scores.directness_score - u2_scores.directness_score);
  age_diff := ABS(u1_age - u2_age);
  
  -- Calculate compatibility score (normalized 0-1, higher is better)
  compatibility_score := 1.0 - (
    (extroversion_diff + agreeableness_diff + openness_diff + 
     conscientiousness_diff + neuroticism_diff + directness_diff) / 24.0 +
    LEAST(age_diff / 20.0, 1.0) * 0.2
  );
  
  -- Determine compatibility label based on rules
  -- Compatible (1): Similar extroversion, similar conscientiousness, low age gap
  -- Incompatible (0): High differences in key traits or large age gap
  IF (extroversion_diff <= 1.5 AND conscientiousness_diff <= 1.5 AND age_diff <= 5) OR
     (agreeableness_diff <= 1.0 AND neuroticism_diff <= 1.5 AND age_diff <= 3) THEN
    compatibility_label := 1;
  ELSE
    compatibility_label := 0;
  END IF;
  
  -- Store the match result
  INSERT INTO public.user_compatibility_matches (
    user1_id, user2_id, compatibility_score, extroversion_diff,
    agreeableness_diff, openness_to_experience_diff, conscientiousness_diff,
    neuroticism_diff, directness_diff, age_diff, compatibility_label
  ) VALUES (
    p_user1_id, p_user2_id, compatibility_score, extroversion_diff,
    agreeableness_diff, openness_diff, conscientiousness_diff,
    neuroticism_diff, directness_diff, age_diff, compatibility_label
  )
  ON CONFLICT (user1_id, user2_id) DO UPDATE SET
    compatibility_score = EXCLUDED.compatibility_score,
    extroversion_diff = EXCLUDED.extroversion_diff,
    agreeableness_diff = EXCLUDED.agreeableness_diff,
    openness_to_experience_diff = EXCLUDED.openness_to_experience_diff,
    conscientiousness_diff = EXCLUDED.conscientiousness_diff,
    neuroticism_diff = EXCLUDED.neuroticism_diff,
    directness_diff = EXCLUDED.directness_diff,
    age_diff = EXCLUDED.age_diff,
    compatibility_label = EXCLUDED.compatibility_label;
  
  RETURN jsonb_build_object(
    'compatibility_score', compatibility_score,
    'compatibility_label', compatibility_label,
    'extroversion_diff', extroversion_diff,
    'agreeableness_diff', agreeableness_diff,
    'age_diff', age_diff
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically calculate scores when user completes test
CREATE OR REPLACE FUNCTION public.trigger_calculate_compatibility_scores()
RETURNS TRIGGER AS $$
DECLARE
  answer_count INTEGER;
BEGIN
  -- Count total answers for the user
  SELECT COUNT(*) INTO answer_count
  FROM public.user_compatibility_answers
  WHERE user_id = NEW.user_id;
  
  -- If user has answered all 15 questions, calculate their scores
  IF answer_count = 15 THEN
    PERFORM public.calculate_compatibility_scores(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_compatibility_answer_complete
  AFTER INSERT OR UPDATE ON public.user_compatibility_answers
  FOR EACH ROW EXECUTE FUNCTION public.trigger_calculate_compatibility_scores();

-- Add updated_at trigger for scores table
CREATE TRIGGER update_compatibility_scores_updated_at
  BEFORE UPDATE ON public.user_compatibility_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();