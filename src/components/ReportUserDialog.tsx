import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName?: string;
  chatId?: string;
}

const reportTypes = [
  { value: 'inappropriate_content', label: 'Inappropriate Content', description: 'Sharing inappropriate photos or messages' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or unwanted contact' },
  { value: 'fake_profile', label: 'Fake Profile', description: 'Using fake photos or false information' },
  { value: 'spam', label: 'Spam', description: 'Sending promotional content or repetitive messages' },
  { value: 'underage', label: 'Underage User', description: 'User appears to be under 18 years old' },
  { value: 'other', label: 'Other', description: 'Other safety or community guideline violations' }
];

export const ReportUserDialog = ({ 
  open, 
  onOpenChange, 
  reportedUserId, 
  reportedUserName = "this user",
  chatId 
}: ReportUserDialogProps) => {
  const [reportType, setReportType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmitReport = async () => {
    if (!reportType) {
      toast({
        title: "Missing Information",
        description: "Please select a reason for reporting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to report a user.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          report_type: reportType,
          description: description.trim() || null,
          chat_id: chatId || null,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Reported",
            description: "You have already reported this user. Our team will review your previous report.",
            variant: "destructive",
          });
        } else {
          console.error('Report submission error:', error);
          toast({
            title: "Report Failed",
            description: "Failed to submit report. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Report Submitted",
        description: `Thank you for reporting ${reportedUserName}. Our team will review this report and take appropriate action.`,
      });

      // Reset form and close dialog
      setReportType('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      console.error('Report error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedReportType = reportTypes.find(type => type.value === reportType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report User
          </DialogTitle>
          <DialogDescription>
            Report {reportedUserName} for behavior that violates our community guidelines. 
            All reports are reviewed by our safety team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              False reports may result in action against your account. Only report genuine safety concerns.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="report-type">Reason for reporting *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReportType && (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>{selectedReportType.label}:</strong> {selectedReportType.description}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help our review..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {description.length}/500 characters
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReport}
            disabled={loading || !reportType}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};