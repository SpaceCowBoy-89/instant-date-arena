-- Fix the trigger function by correcting the tag extraction logic
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
  SELECT jsonb_object_agg(tag_element, tag_count) INTO tag_counts
  FROM (
    SELECT 
      tag_element,
      COUNT(*) as tag_count
    FROM public.user_connections_answers uca
    CROSS JOIN LATERAL jsonb_array_elements_text(uca.selected_answer->'tags') AS tag_element
    WHERE uca.user_id = NEW.user_id
    GROUP BY tag_element
  ) tag_summary;

  -- Find the tag with maximum count
  SELECT key, value::INT INTO max_tag, max_count
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;