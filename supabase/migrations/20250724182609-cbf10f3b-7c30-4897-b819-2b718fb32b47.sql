-- Add user verification and safety features for App Store compliance

-- Add verification status to users table
ALTER TABLE public.users 
ADD COLUMN verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
ADD COLUMN verification_method TEXT,
ADD COLUMN verification_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verification_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'banned')),
ADD COLUMN reports_count INTEGER DEFAULT 0;

-- Create user_reports table for reporting inappropriate content/behavior
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('inappropriate_content', 'harassment', 'fake_profile', 'spam', 'underage', 'other')),
  description TEXT,
  chat_id UUID REFERENCES public.chats(chat_id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate reports from same user for same person
  UNIQUE(reporter_id, reported_user_id)
);

-- Enable RLS on user_reports
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for user_reports
CREATE POLICY "Users can create reports" 
ON public.user_reports 
FOR INSERT 
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
ON public.user_reports 
FOR SELECT 
USING (auth.uid() = reporter_id);

-- Create blocked_users table for user blocking functionality
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Prevent duplicate blocks
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on blocked_users
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Create policies for blocked_users
CREATE POLICY "Users can create blocks" 
ON public.blocked_users 
FOR INSERT 
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can view their blocks" 
ON public.blocked_users 
FOR SELECT 
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can remove their blocks" 
ON public.blocked_users 
FOR DELETE 
USING (auth.uid() = blocker_id);

-- Create user_verifications table for identity verification
CREATE TABLE public.user_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('phone', 'email', 'id_document', 'social_media')),
  verification_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_verifications
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for user_verifications
CREATE POLICY "Users can create their own verifications" 
ON public.user_verifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own verifications" 
ON public.user_verifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create trigger to update user verification status
CREATE OR REPLACE FUNCTION public.update_user_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user verification status based on verification records
  IF NEW.status = 'approved' THEN
    UPDATE public.users 
    SET verification_status = 'verified',
        verification_method = NEW.verification_type,
        verification_approved_at = NEW.reviewed_at
    WHERE id = NEW.user_id;
  ELSIF NEW.status = 'rejected' THEN
    UPDATE public.users 
    SET verification_status = 'rejected'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_verification_trigger
  AFTER UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_verification_status();

-- Create trigger to increment report count
CREATE OR REPLACE FUNCTION public.increment_user_reports()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users 
  SET reports_count = reports_count + 1
  WHERE id = NEW.reported_user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_reports_trigger
  AFTER INSERT ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_user_reports();

-- Add updated_at triggers
CREATE TRIGGER update_user_reports_updated_at
  BEFORE UPDATE ON public.user_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON public.user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();