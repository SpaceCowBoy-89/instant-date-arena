-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.calculate_compatibility_scores(p_user_id UUID)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
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
$$;

-- Fix second function
CREATE OR REPLACE FUNCTION public.calculate_user_compatibility(p_user1_id UUID, p_user2_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
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
$$;

-- Fix third function
CREATE OR REPLACE FUNCTION public.trigger_calculate_compatibility_scores()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
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
$$;