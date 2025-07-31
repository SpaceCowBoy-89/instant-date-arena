-- Add account deletion tracking
ALTER TABLE public.users 
ADD COLUMN deletion_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deletion_scheduled_at TIMESTAMP WITH TIME ZONE;

-- Create account deletion requests table for compliance tracking
CREATE TABLE public.account_deletion_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_deletion_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '90 days'),
  status TEXT NOT NULL DEFAULT 'pending',
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for account deletion requests
CREATE POLICY "Users can create their own deletion requests" 
ON public.account_deletion_requests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own deletion requests" 
ON public.account_deletion_requests 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to process account deletion requests
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID;
  deletion_date TIMESTAMP WITH TIME ZONE;
  result jsonb;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Calculate deletion date (90 days from now)
  deletion_date := now() + interval '90 days';
  
  -- Update user record
  UPDATE public.users 
  SET 
    deletion_requested_at = now(),
    deletion_scheduled_at = deletion_date,
    updated_at = now()
  WHERE id = current_user_id;
  
  -- Create deletion request record
  INSERT INTO public.account_deletion_requests (
    user_id,
    scheduled_deletion_at,
    status
  ) VALUES (
    current_user_id,
    deletion_date,
    'pending'
  );
  
  result := jsonb_build_object(
    'success', true,
    'deletion_scheduled_at', deletion_date,
    'message', 'Account deletion requested successfully'
  );
  
  RETURN result;
END;
$$;

-- Create trigger for updating timestamps
CREATE TRIGGER update_account_deletion_requests_updated_at
BEFORE UPDATE ON public.account_deletion_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();