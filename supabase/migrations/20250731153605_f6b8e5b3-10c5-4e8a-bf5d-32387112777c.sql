-- Fix RLS policy for rate_limits table
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);