-- Update the trigger function to require 10 questions instead of 8
CREATE OR REPLACE FUNCTION public.update_user_connections_group()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tag_counts JSONB;
  max_tag TEXT;
  max_count INT;
  tie_tags TEXT[];
  selected_group_id UUID;
  total_answers INT;
BEGIN
  -- Count total answers for the user
  SELECT COUNT(*) INTO total_answers
  FROM public.user_connections_answers
  WHERE user_id = NEW.user_id;

  -- Only proceed if user has answered exactly 10 questions (updated from 8)
  IF total_answers < 10 THEN
    RETURN NEW;
  END IF;

  -- Calculate tag counts for the user
  WITH tag_summary AS (
    SELECT 
      jsonb_array_elements_text(uca.selected_answer->'tags') as tag_element,
      COUNT(*) as tag_count
    FROM public.user_connections_answers uca
    WHERE uca.user_id = NEW.user_id
    GROUP BY jsonb_array_elements_text(uca.selected_answer->'tags')
  )
  SELECT jsonb_object_agg(tag_element, tag_count) INTO tag_counts
  FROM tag_summary;

  -- Find the tag with maximum count
  SELECT key, value::INT INTO max_tag, max_count
  FROM jsonb_each_text(tag_counts)
  ORDER BY (value::INT) DESC, key ASC
  LIMIT 1;

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
$function$;