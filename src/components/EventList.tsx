import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, MapPin, Users, Clock, User, MoreVertical, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ReportUserDialog } from "@/components/ReportUserDialog";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_attendees: number;
  creator_id: string;
  attendee_count?: number;
  is_attending?: boolean;
  is_creator?: boolean;
  creator_name?: string;
}

interface EventListProps {
  groupId: string;
  userId: string;
  key?: number; // Add key prop to force refresh
}

export const EventList = ({ groupId, userId }: EventListProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportDialog, setReportDialog] = useState({
    open: false,
    eventId: '',
    creatorId: '',
    creatorName: '',
    eventTitle: ''
  });
  const { toast } = useToast();

  const loadEvents = async () => {
    try {
      // Load events for this group
      const { data: eventsData, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('group_id', groupId)
        .gte('event_date', new Date().toISOString()) // Only future events
        .order('event_date', { ascending: true });

      if (error) throw error;

      if (eventsData) {
        // For each event, check attendance and get creator info
        const eventsWithAttendance = await Promise.all(
          eventsData.map(async (event) => {
            // Get attendee count
            const { count: attendeeCount } = await supabase
              .from('event_attendees')
              .select('*', { count: 'exact', head: true })
              .eq('event_id', event.id);

            // Check if current user is attending
            const { data: userAttendance } = await supabase
              .from('event_attendees')
              .select('*')
              .eq('event_id', event.id)
              .eq('user_id', userId)
              .single();

            // Get creator name
            const { data: creatorData } = await supabase
              .from('users')
              .select('name')
              .eq('id', event.creator_id)
              .single();

            return {
              ...event,
              attendee_count: attendeeCount || 0,
              is_attending: !!userAttendance,
              is_creator: event.creator_id === userId,
              creator_name: creatorData?.name || `User ${event.creator_id.slice(0, 8)}`
            };
          })
        );

        setEvents(eventsWithAttendance);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceToggle = async (eventId: string, isCurrentlyAttending: boolean) => {
    try {
      if (isCurrentlyAttending) {
        // Remove attendance
        const { error } = await supabase
          .from('event_attendees')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', userId);

        if (error) throw error;

        toast({
          title: "No longer attending",
          description: "You've been removed from this event",
        });
      } else {
        // Add attendance
        const { error } = await supabase
          .from('event_attendees')
          .insert({
            event_id: eventId,
            user_id: userId,
            status: 'attending'
          });

        if (error) throw error;

        toast({
          title: "You're attending!",
          description: "You've been added to this event",
        });
      }

      // Reload events to update counts
      loadEvents();
    } catch (error) {
      console.error('Error toggling attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadEvents();
  }, [groupId, userId]); // This will re-run when key changes from parent

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No upcoming events</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                {event.description && (
                  <CardDescription className="mt-1">{event.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2">
                {event.is_creator && (
                  <Badge variant="secondary">
                    <User className="h-3 w-3 mr-1" />
                    Creator
                  </Badge>
                )}
                {/* Show report option for events from other users */}
                {!event.is_creator && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setReportDialog({
                        open: true,
                        eventId: event.id,
                        creatorId: event.creator_id,
                        creatorName: event.creator_name || 'Unknown User',
                        eventTitle: event.title
                      })}>
                        <Flag className="h-3 w-3 mr-2" />
                        Report Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {new Date(event.event_date).toLocaleDateString()} at{' '}
                {new Date(event.event_date).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {event.location}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {event.attendee_count} attending
                {event.max_attendees && ` (max ${event.max_attendees})`}
              </div>
            </div>
            
            {!event.is_creator && (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant={event.is_attending ? "outline" : "default"}
                  onClick={() => handleAttendanceToggle(event.id, event.is_attending || false)}
                  disabled={
                    !event.is_attending && 
                    event.max_attendees !== null && 
                    (event.attendee_count || 0) >= event.max_attendees
                  }
                >
                  {event.is_attending ? "Leave Event" : 
                   (!event.is_attending && event.max_attendees !== null && (event.attendee_count || 0) >= event.max_attendees) ? 
                   "Event Full" : "Join Event"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      <ReportUserDialog
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog(prev => ({ ...prev, open }))}
        reportedUserId={reportDialog.creatorId}
        reportedUserName={reportDialog.creatorName}
        messageId={reportDialog.eventId}
        messageContent={`Event: ${reportDialog.eventTitle}`}
      />
    </div>
  );
};