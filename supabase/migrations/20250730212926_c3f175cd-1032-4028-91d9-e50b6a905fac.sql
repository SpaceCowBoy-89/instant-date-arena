-- Fix the function search path security warning
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for updating user groups based on answers
CREATE TRIGGER update_connections_group_trigger
  AFTER INSERT OR UPDATE ON public.user_connections_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_connections_group();