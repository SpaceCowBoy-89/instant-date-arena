import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchName?: string;
  groupName?: string;
  type: 'match' | 'group';
}

export function FeedbackModal({ open, onOpenChange, matchName, groupName, type }: FeedbackModalProps) {
  const [connectionRating, setConnectionRating] = useState([3]);
  const [enjoymentRating, setEnjoymentRating] = useState([3]);
  const [submitting, setSubmitting] = useState(false);

  const displayName = type === 'match' ? matchName : groupName;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to submit feedback');
        return;
      }

      const feedbackData = {
        user_id: user.id,
        feedback_type: type,
        target_name: displayName,
        connection_rating: connectionRating[0],
        enjoyment_rating: type === 'group' ? enjoymentRating[0] : null,
        submitted_at: new Date().toISOString(),
      };

      // In a real app, you'd save this to a feedback table
      console.log('Feedback submitted:', feedbackData);
      
      toast.success('Thank you for your feedback!');
      onOpenChange(false);
      
      // Reset ratings
      setConnectionRating([3]);
      setEnjoymentRating([3]);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto px-4 py-6 sm:w-full sm:max-w-md" hideCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="text-center">
            How's It Going with {displayName || (type === 'match' ? 'Your Match' : 'Your Group')}?
          </DialogTitle>
          <DialogDescription className="text-center">
            Your feedback helps us improve our matching and group recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4 sm:space-y-6 sm:my-6">
          {/* Connection Rating */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              On a scale of 1 to 5, how well do you feel you connect?
            </label>
            <div className="space-y-2">
              <Slider
                value={connectionRating}
                onValueChange={setConnectionRating}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Poor Connection</span>
                <div className="flex items-center space-x-1">
                  {renderStars(connectionRating[0])}
                  <span className="ml-2 font-medium">{connectionRating[0]}/5</span>
                </div>
                <span>Great Connection</span>
              </div>
            </div>
          </div>

          {/* Group Enjoyment Rating */}
          {type === 'group' && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                How much do you enjoy {groupName || 'group'} activities?
              </label>
              <div className="space-y-2">
                <Slider
                  value={enjoymentRating}
                  onValueChange={setEnjoymentRating}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Not Enjoyable</span>
                  <div className="flex items-center space-x-1">
                    {renderStars(enjoymentRating[0])}
                    <span className="ml-2 font-medium">{enjoymentRating[0]}/5</span>
                  </div>
                  <span>Very Enjoyable</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:gap-3 mt-4 sm:mt-6">
          <Button
            onClick={handleSubmit}
            className="w-full min-h-[44px] touch-manipulation"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full min-h-[44px] touch-manipulation">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}