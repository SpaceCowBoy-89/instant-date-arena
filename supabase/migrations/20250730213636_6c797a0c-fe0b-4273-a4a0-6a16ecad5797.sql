-- Add INSERT policy for connections_questions to allow seeding questions
CREATE POLICY "System can insert questions" 
ON public.connections_questions 
FOR INSERT 
WITH CHECK (true);