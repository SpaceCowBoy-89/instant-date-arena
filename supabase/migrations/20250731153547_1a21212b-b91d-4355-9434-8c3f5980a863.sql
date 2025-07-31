-- Add comprehensive audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow viewing own audit logs (for future user security dashboard)
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add database constraints for critical business rules
ALTER TABLE public.users 
ADD CONSTRAINT check_age_range CHECK (age >= 18 AND age <= 100),
ADD CONSTRAINT check_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
ADD CONSTRAINT check_bio_length CHECK (char_length(bio) <= 500);

-- Add constraints for connections group messages (correct table name)
ALTER TABLE public.connections_group_messages 
ADD CONSTRAINT check_message_length CHECK (char_length(message) <= 1000 AND char_length(message) > 0);

ALTER TABLE public.user_reports 
ADD CONSTRAINT check_report_description_length CHECK (char_length(description) <= 500);

-- Add rate limiting table for enhanced security
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- Could be user_id, ip_address, etc.
  action_type TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Create unique index for rate limiting
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_identifier_action 
ON public.rate_limits(identifier, action_type, window_start);

-- Add trigger for audit logging on sensitive operations
CREATE OR REPLACE FUNCTION public.log_security_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Log security-sensitive events
  IF TG_TABLE_NAME = 'user_reports' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (NEW.reporter_id, 'user_report_created', 
            jsonb_build_object('reported_user_id', NEW.reported_user_id, 'report_type', NEW.report_type));
  ELSIF TG_TABLE_NAME = 'user_interactions' AND TG_OP = 'INSERT' AND NEW.interaction_type = 'block' THEN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (NEW.user_id, 'user_blocked', 
            jsonb_build_object('blocked_user_id', NEW.target_user_id));
  ELSIF TG_TABLE_NAME = 'account_deletion_requests' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (NEW.user_id, 'account_deletion_requested', 
            jsonb_build_object('scheduled_deletion_at', NEW.scheduled_deletion_at));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for audit logging
CREATE TRIGGER audit_user_reports
  AFTER INSERT ON public.user_reports
  FOR EACH ROW EXECUTE FUNCTION public.log_security_event();

CREATE TRIGGER audit_user_blocks
  AFTER INSERT ON public.user_interactions
  FOR EACH ROW EXECUTE FUNCTION public.log_security_event();

CREATE TRIGGER audit_deletion_requests
  AFTER INSERT ON public.account_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.log_security_event();

-- Enhanced rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_action_type TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  current_count INTEGER;
  window_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate window start time
  window_start_time := date_trunc('hour', now()) + 
    (EXTRACT(minute FROM now())::INTEGER / p_window_minutes) * (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Clean up old rate limit records (older than 24 hours)
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - interval '24 hours';
  
  -- Get or create rate limit record
  INSERT INTO public.rate_limits (identifier, action_type, count, window_start)
  VALUES (p_identifier, p_action_type, 1, window_start_time)
  ON CONFLICT (identifier, action_type, window_start)
  DO UPDATE SET 
    count = public.rate_limits.count + 1,
    updated_at = now()
  RETURNING count INTO current_count;
  
  -- Return whether request is within limits
  RETURN current_count <= p_max_requests;
END;
$function$;

-- Add function to detect suspicious patterns
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  recent_reports INTEGER;
  recent_blocks INTEGER;
  rapid_interactions INTEGER;
  risk_score INTEGER := 0;
  flags TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Count recent reports against this user (last 24 hours)
  SELECT COUNT(*) INTO recent_reports
  FROM public.user_reports
  WHERE reported_user_id = p_user_id 
    AND created_at > now() - interval '24 hours';
  
  -- Count recent blocks by this user (last 24 hours)
  SELECT COUNT(*) INTO recent_blocks
  FROM public.user_interactions
  WHERE user_id = p_user_id 
    AND interaction_type = 'block'
    AND created_at > now() - interval '24 hours';
  
  -- Count rapid interactions (more than 100 in last hour)
  SELECT COUNT(*) INTO rapid_interactions
  FROM public.user_interactions
  WHERE user_id = p_user_id 
    AND created_at > now() - interval '1 hour';
  
  -- Calculate risk score and flags
  IF recent_reports >= 3 THEN
    risk_score := risk_score + 50;
    flags := array_append(flags, 'multiple_reports');
  END IF;
  
  IF recent_blocks >= 10 THEN
    risk_score := risk_score + 30;
    flags := array_append(flags, 'excessive_blocking');
  END IF;
  
  IF rapid_interactions >= 100 THEN
    risk_score := risk_score + 40;
    flags := array_append(flags, 'rapid_interactions');
  END IF;
  
  -- Log if high risk
  IF risk_score >= 50 THEN
    INSERT INTO public.security_audit_log (user_id, event_type, event_data)
    VALUES (p_user_id, 'suspicious_activity_detected', 
            jsonb_build_object('risk_score', risk_score, 'flags', flags));
  END IF;
  
  RETURN jsonb_build_object(
    'risk_score', risk_score,
    'flags', flags,
    'is_suspicious', risk_score >= 50
  );
END;
$function$;