-- Fix unique constraint in user_reports to allow post-specific reporting

-- Drop the old unique constraint that prevented multiple reports per user
ALTER TABLE public.user_reports
DROP CONSTRAINT IF EXISTS user_reports_reporter_id_reported_user_id_key;

-- Add new unique constraints for post-specific and message-specific reporting
-- Prevent duplicate reports for the same post
ALTER TABLE public.user_reports
ADD CONSTRAINT user_reports_post_unique
UNIQUE (reporter_id, reported_user_id, post_id)
WHERE post_id IS NOT NULL;

-- Prevent duplicate reports for the same message
ALTER TABLE public.user_reports
ADD CONSTRAINT user_reports_message_unique
UNIQUE (reporter_id, reported_user_id, message_id)
WHERE message_id IS NOT NULL;

-- Prevent duplicate general user reports (when no specific post/message)
ALTER TABLE public.user_reports
ADD CONSTRAINT user_reports_general_unique
UNIQUE (reporter_id, reported_user_id)
WHERE post_id IS NULL AND message_id IS NULL;