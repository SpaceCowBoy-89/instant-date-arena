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
import { SecurityMonitor, checkClientRateLimit, logSecurityEvent } from "@/utils/securityHelpers";

interface ReportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId: string;
  reportedUserName?: string;
  chatId?: string;
  messageId?: string;
  messageContent?: string;
  onChatEnded?: () => void;
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
  chatId,
  messageId,
  messageContent,
  onChatEnded
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

      // Check rate limiting for reports
      const rateLimitOk = await checkClientRateLimit('user_report', 5, 60);
      if (!rateLimitOk) {
        toast({
          title: "Too Many Reports",
          description: "Please wait before submitting another report.",
          variant: "destructive",
        });
        return;
      }

      // Track security activity
      const securityMonitor = SecurityMonitor.getInstance();
      securityMonitor.trackAction('report');
      
      const securityCheck = securityMonitor.checkSuspiciousActivity();
      if (securityCheck.riskLevel === 'high') {
        await logSecurityEvent('high_risk_report_attempt', {
          reported_user_id: reportedUserId,
          risk_level: securityCheck.riskLevel,
          warnings: securityCheck.warnings
        });
      }

      // Validate input on server side
      const { data: validation } = await supabase.functions.invoke('validate-user-input', {
        body: {
          type: 'report',
          data: {
            report_type: reportType,
            reported_user_id: reportedUserId,
            description: description.trim()
          }
        }
      });

      if (validation && !validation.isValid) {
        toast({
          title: "Invalid Information",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      const sanitizedData = validation?.sanitizedData || {
        report_type: reportType,
        reported_user_id: reportedUserId,
        description: description.trim()
      };

      const reportData: any = {
        reporter_id: user.id,
        reported_user_id: sanitizedData.reported_user_id,
        report_type: sanitizedData.report_type,
        description: sanitizedData.description || null,
        status: 'pending'
      };

      // Add message_id if reporting a specific message
      if (messageId) {
        reportData.message_id = messageId;
      }

      // Add chat_id if available
      if (chatId) {
        reportData.chat_id = chatId;
      }

      const { error } = await supabase
        .from('user_reports')
        .insert(reportData);

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

      // End the chat if it's a SpeedDate
      if (chatId) {
        const { error: chatError } = await supabase
          .from('chats')
          .update({ 
            status: 'ended_manually',
            ended_at: new Date().toISOString(),
            ended_by: user.id
          })
          .eq('chat_id', chatId);

        if (chatError) {
          console.error('Error ending chat:', chatError);
        }
      }

      toast({
        title: "Report Submitted",
        description: `Thank you for reporting ${reportedUserName}. Our team will review this report and take appropriate action.`,
      });

      // Reset form and close dialog
      setReportType('');
      setDescription('');
      onChatEnded?.();
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
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[85vh] overflow-y-auto mobile-container p-4 sm:p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-5 w-5 text-red-500 shrink-0" />
            {messageId ? 'Report Message' : 'Report User'}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Report {reportedUserName} for behavior that violates our community guidelines. 
            All reports are reviewed by our safety team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {messageId && messageContent && (
            <Alert className="border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
              <AlertDescription className="text-sm">
                <div className="space-y-2">
                  <div className="font-medium">Reported Message:</div>
                  <div className="p-3 bg-background border rounded-md text-xs font-mono">
                    "{messageContent}"
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-sm">
              False reports may result in action against your account. Only report genuine safety concerns.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Label htmlFor="report-type" className="text-sm font-medium">Reason for reporting *</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="h-11 sm:h-12 text-left">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {reportTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReportType && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <AlertDescription className="text-sm">
                <strong>{selectedReportType.label}:</strong> {selectedReportType.description}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-medium">Additional details (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any additional context that might help our review..."
              className="min-h-[80px] sm:min-h-[100px] resize-none text-sm leading-relaxed"
              maxLength={500}
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Help us understand the situation better</span>
              <span>{description.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto h-10 sm:h-12 text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitReport}
            disabled={loading || !reportType}
            variant="destructive"
            className="w-full sm:w-auto h-10 sm:h-12 text-sm font-medium"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};