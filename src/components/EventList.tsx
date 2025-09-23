import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IOSSafeDropdown, IOSSafeDropdownItem } from "@/components/ui/ios-safe-dropdown";
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

        // Update badge progress for joining events
        try {
          const { updateBadgeProgress, showBadgeNotification, BADGE_ACTIONS } = await import('@/utils/badgeUtils');
          const result = await updateBadgeProgress(BADGE_ACTIONS.EVENTS_JOINED);
          if (result?.newly_earned?.length > 0) {
            showBadgeNotification(result.newly_earned, toast);
          }
        } catch (error) {
          console.error('Error updating badge progress:', error);
        }

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
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50 dark:border-purple-800/30">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Upcoming Events</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This community hasn't scheduled any events yet. Create one to bring members together!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <div className="relative">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-romance via-accent to-romance"></div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-foreground mb-1">{event.title}</CardTitle>
                  {event.description && (
                    <CardDescription className="text-sm leading-relaxed">{event.description}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {event.is_creator && (
                    <Badge variant="secondary" className="bg-romance/10 text-romance border-romance/20">
                      <User className="h-3 w-3 mr-1" />
                      Creator
                    </Badge>
                  )}
                  {/* Show report option for events from other users */}
                  {!event.is_creator && (
                    <IOSSafeDropdown
                      title="Event Options"
                      trigger={
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] touch-target">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <IOSSafeDropdownItem onClick={() => setReportDialog({
                        open: true,
                        eventId: event.id,
                        creatorId: event.creator_id,
                        creatorName: event.creator_name || 'Unknown User',
                        eventTitle: event.title
                      })}>
                        <Flag className="h-3 w-3 mr-2" />
                        Report Event
                      </IOSSafeDropdownItem>
                    </IOSSafeDropdown>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-6">
              <div className="grid gap-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-romance/10">
                    <Clock className="h-4 w-4 text-romance" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Time:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.event_date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/10">
                      <MapPin className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Location:</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Attendees:</p>
                    <p className="text-sm text-muted-foreground">
                      {event.attendee_count} attending
                      {event.max_attendees && ` (max ${event.max_attendees})`}
                    </p>
                  </div>
                </div>
              </div>

              {!event.is_creator && (
                <div className="flex justify-end">
                  <Button
                    size="lg"
                    variant={event.is_attending ? "outline" : "default"}
                    onClick={() => handleAttendanceToggle(event.id, event.is_attending || false)}
                    disabled={
                      !event.is_attending &&
                      event.max_attendees !== null &&
                      (event.attendee_count || 0) >= event.max_attendees
                    }
                    className={`px-8 py-2 font-medium transition-all duration-200 ${
                      event.is_attending
                        ? "border-romance text-romance hover:bg-romance/5"
                        : "bg-gradient-to-r from-romance to-accent hover:from-romance/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {event.is_attending ? "Leave Event" :
                     (!event.is_attending && event.max_attendees !== null && (event.attendee_count || 0) >= event.max_attendees) ?
                     "Event Full" : "Join"}
                  </Button>
                </div>
              )}
            </CardContent>
          </div>
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