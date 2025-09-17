import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateEventDialogProps {
  groupId: string;
  userId: string;
  onEventCreated: () => void;
}

export const CreateEventDialog = ({ groupId, userId, onEventCreated }: CreateEventDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate || !eventTime) {
      toast({
        title: "Missing information",
        description: "Please fill in the required fields (title, date, and time)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time into a proper timestamp
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);
      
      const { error } = await supabase
        .from('community_events')
        .insert({
          group_id: groupId,
          creator_id: userId,
          title: title.trim(),
          description: description.trim() || null,
          event_date: eventDateTime.toISOString(),
          location: location.trim() || null,
          max_attendees: maxAttendees ? parseInt(maxAttendees) : null
        });

      if (error) throw error;

      toast({
        title: "Event created!",
        description: "Your event has been created successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      setLocation("");
      setMaxAttendees("");
      setOpen(false);
      onEventCreated();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Calendar className="h-4 w-4 mr-2" />
          Start Event
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[85vw] sm:w-[90vw] max-w-xs sm:max-w-lg h-auto max-h-[80vh] sm:max-h-[90vh] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-romance/20 dark:border-romance/30 shadow-2xl rounded-2xl sm:rounded-3xl overflow-y-auto" hideCloseButton={true}>
        <DialogHeader className="text-center pb-3 sm:pb-6">
          <div className="mx-auto w-10 h-10 sm:w-16 sm:h-16 bg-gradient-to-br from-romance to-purple-accent rounded-lg sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-4 shadow-lg">
            <Calendar className="h-5 w-5 sm:h-8 sm:w-8 text-white" />
          </div>
          <DialogTitle className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-romance to-purple-accent bg-clip-text text-transparent">
            Create New Event
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs sm:text-base px-2">
            Bring your community together with an amazing event
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6 px-2 sm:px-1">
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="title" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-romance" />
              Event Title *
            </Label>
            <Input
              id="title"
              placeholder="Community Meetup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-2 border-muted/40 focus-visible:ring-2 focus-visible:ring-romance/50 focus-visible:border-romance/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-base min-h-[44px]"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="description" className="text-sm font-semibold text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Tell people what this event is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="border-2 border-muted/40 focus-visible:ring-2 focus-visible:ring-romance/50 focus-visible:border-romance/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-base resize-none min-h-[80px]"
              style={{ fontSize: '16px' }}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="date" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-romance" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border-2 border-muted/40 focus-visible:ring-2 focus-visible:ring-romance/50 focus-visible:border-romance/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-base min-h-[44px]"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="space-y-2 sm:space-y-3">
              <Label htmlFor="time" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-romance" />
                Time *
              </Label>
              <Input
                id="time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="border-2 border-muted/40 focus-visible:ring-2 focus-visible:ring-romance/50 focus-visible:border-romance/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-base min-h-[44px]"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="location" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-romance" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Central Park, NYC"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="border-2 border-muted/40 focus-visible:ring-2 focus-visible:ring-romance/50 focus-visible:border-romance/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-base min-h-[44px]"
              style={{ fontSize: '16px' }}
            />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="maxAttendees" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-romance" />
              Max Attendees
            </Label>
            <Input
              id="maxAttendees"
              type="number"
              placeholder="Optional limit"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              min="1"
              className="border-2 border-muted/40 focus-visible:ring-2 focus-visible:ring-romance/50 focus-visible:border-romance/50 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-base min-h-[44px]"
              style={{ fontSize: '16px' }}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-6 border-t border-muted/20">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="w-full sm:flex-1 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-lg sm:rounded-xl py-3 font-medium transition-all duration-200 min-h-[48px] order-2 sm:order-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full sm:flex-1 bg-gradient-to-r from-romance to-purple-accent hover:from-romance-dark hover:to-purple-accent text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg sm:rounded-xl py-3 font-semibold disabled:opacity-50 min-h-[48px] order-1 sm:order-2 active:scale-95"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Create Event</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};