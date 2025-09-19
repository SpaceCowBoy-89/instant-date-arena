-- Create arena notification requests table
CREATE TABLE public.arena_notification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  arena_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notification_sent BOOLEAN NOT NULL DEFAULT false,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, arena_id)
);

-- Enable RLS
ALTER TABLE public.arena_notification_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for arena notification requests
CREATE POLICY "Users can manage their own notification requests" 
ON public.arena_notification_requests 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service can access all notification requests for processing
CREATE POLICY "Service can access all notification requests" 
ON public.arena_notification_requests 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_arena_notification_requests_updated_at
BEFORE UPDATE ON public.arena_notification_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to schedule arena notifications
CREATE OR REPLACE FUNCTION public.schedule_arena_notification(
  p_user_id UUID,
  p_arena_id TEXT,
  p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Insert or update notification request
  INSERT INTO public.arena_notification_requests (user_id, arena_id, scheduled_for, is_active, notification_sent)
  VALUES (p_user_id, p_arena_id, p_scheduled_for, true, false)
  ON CONFLICT (user_id, arena_id) 
  DO UPDATE SET 
    is_active = true,
    notification_sent = false,
    scheduled_for = COALESCE(EXCLUDED.scheduled_for, arena_notification_requests.scheduled_for),
    updated_at = now();
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Notification request scheduled successfully'
  );
  
  RETURN result;
END;
$$;

-- Create function to cancel arena notifications
CREATE OR REPLACE FUNCTION public.cancel_arena_notification(
  p_user_id UUID,
  p_arena_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Mark notification request as inactive
  UPDATE public.arena_notification_requests 
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND arena_id = p_arena_id;
  
  result := jsonb_build_object(
    'success', true,
    'message', 'Notification request cancelled successfully'
  );
  
  RETURN result;
END;
$$;