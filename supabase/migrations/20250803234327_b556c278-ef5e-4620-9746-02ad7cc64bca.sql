-- Create events table for community events
CREATE TABLE public.community_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  max_attendees INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event attendees table
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'attending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create policies for community_events
CREATE POLICY "Users can view events in groups they belong to" 
ON public.community_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections_groups 
    WHERE user_id = auth.uid() AND group_id = community_events.group_id
  )
);

CREATE POLICY "Users can create events in groups they belong to" 
ON public.community_events 
FOR INSERT 
WITH CHECK (
  auth.uid() = creator_id AND
  EXISTS (
    SELECT 1 FROM public.user_connections_groups 
    WHERE user_id = auth.uid() AND group_id = community_events.group_id
  )
);

CREATE POLICY "Event creators can update their events" 
ON public.community_events 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Event creators can delete their events" 
ON public.community_events 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create policies for event_attendees
CREATE POLICY "Users can view attendees for events they can see" 
ON public.event_attendees 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.user_connections_groups ucg ON ce.group_id = ucg.group_id
    WHERE ce.id = event_attendees.event_id AND ucg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join events in their groups" 
ON public.event_attendees 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.user_connections_groups ucg ON ce.group_id = ucg.group_id
    WHERE ce.id = event_attendees.event_id AND ucg.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own attendance" 
ON public.event_attendees 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own attendance" 
ON public.event_attendees 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updating timestamps
CREATE TRIGGER update_community_events_updated_at
BEFORE UPDATE ON public.community_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();