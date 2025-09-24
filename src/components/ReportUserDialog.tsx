import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Flag, Shield, User, MessageSquare, FileText } from "lucide-react";
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
  postId?: string;
  postContent?: string;
  onChatEnded?: () => void;
}

const reportTypes = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Sharing inappropriate photos or messages',
    icon: FileText,
    gradient: 'from-red-500 to-pink-600',
    color: 'text-red-600 bg-red-50/70 border-red-200/60 dark:text-red-400 dark:bg-red-950/70 dark:border-red-800/60',
    iconBg: 'bg-red-100 dark:bg-red-900/50'
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or unwanted contact',
    icon: Shield,
    gradient: 'from-orange-500 to-red-600',
    color: 'text-orange-600 bg-orange-50/70 border-orange-200/60 dark:text-orange-400 dark:bg-orange-950/70 dark:border-orange-800/60',
    iconBg: 'bg-orange-100 dark:bg-orange-900/50'
  },
  {
    value: 'fake_profile',
    label: 'Fake Profile',
    description: 'Using fake photos or false information',
    icon: User,
    gradient: 'from-purple-500 to-indigo-600',
    color: 'text-purple-600 bg-purple-50/70 border-purple-200/60 dark:text-purple-400 dark:bg-purple-950/70 dark:border-purple-800/60',
    iconBg: 'bg-purple-100 dark:bg-purple-900/50'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Sending promotional content or repetitive messages',
    icon: MessageSquare,
    gradient: 'from-amber-500 to-orange-600',
    color: 'text-amber-600 bg-amber-50/70 border-amber-200/60 dark:text-amber-400 dark:bg-amber-950/70 dark:border-amber-800/60',
    iconBg: 'bg-amber-100 dark:bg-amber-900/50'
  },
  {
    value: 'underage',
    label: 'Underage User',
    description: 'User appears to be under 18 years old',
    icon: AlertTriangle,
    gradient: 'from-rose-500 to-pink-600',
    color: 'text-rose-600 bg-rose-50/70 border-rose-200/60 dark:text-rose-400 dark:bg-rose-950/70 dark:border-rose-800/60',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other safety or community guideline violations',
    icon: Flag,
    gradient: 'from-gray-500 to-slate-600',
    color: 'text-slate-600 bg-slate-50/70 border-slate-200/60 dark:text-slate-400 dark:bg-slate-950/70 dark:border-slate-800/60',
    iconBg: 'bg-slate-100 dark:bg-slate-900/50'
  }
];

export const ReportUserDialog = ({
  open,
  onOpenChange,
  reportedUserId,
  reportedUserName = "this user",
  chatId,
  messageId,
  messageContent,
  postId,
  postContent,
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

      // Check rate limiting for reports (with fallback)
      try {
        const rateLimitOk = await checkClientRateLimit('user_report', 5, 60);
        if (!rateLimitOk) {
          toast({
            title: "Too Many Reports",
            description: "Please wait before submitting another report.",
            variant: "destructive",
          });
          return;
        }
      } catch (rateLimitError) {
        console.warn('Rate limiting function not available:', rateLimitError);
        // Continue without rate limiting if function doesn't exist
      }

      // Track security activity
      const securityMonitor = SecurityMonitor.getInstance();
      securityMonitor.trackAction('report');
      
      const securityCheck = securityMonitor.checkSuspiciousActivity();
      if (securityCheck.riskLevel === 'high') {
        try {
          await logSecurityEvent('high_risk_report_attempt', {
            reported_user_id: reportedUserId,
            risk_level: securityCheck.riskLevel,
            warnings: securityCheck.warnings
          });
        } catch (auditError) {
          console.warn('Security audit logging failed:', auditError);
          // Continue without security logging if table doesn't exist
        }
      }

      // Validate input (with fallback if Edge Function doesn't exist)
      let sanitizedData = {
        report_type: reportType,
        reported_user_id: reportedUserId,
        description: description.trim()
      };

      try {
        const { data: validation, error: validationError } = await supabase.functions.invoke('validate-user-input', {
          body: {
            type: 'report',
            data: sanitizedData
          }
        });

        if (validationError) {
          console.warn('Validation function not available, using client-side validation:', validationError);
          // Continue with client-side validation
        } else if (validation && !validation.isValid) {
          toast({
            title: "Invalid Information",
            description: validation.errors.join(', '),
            variant: "destructive",
          });
          return;
        } else if (validation?.sanitizedData) {
          sanitizedData = validation.sanitizedData;
        }
      } catch (validationError) {
        console.warn('Validation function failed, using client-side validation:', validationError);
        // Continue with client-side validation
      }

      // Basic client-side validation
      if (!sanitizedData.report_type || !sanitizedData.reported_user_id) {
        toast({
          title: "Invalid Information",
          description: "Missing required report information.",
          variant: "destructive",
        });
        return;
      }

      // Sanitize description
      if (sanitizedData.description) {
        sanitizedData.description = sanitizedData.description
          .replace(/[<>]/g, '') // Remove potential HTML
          .substring(0, 500); // Limit length
      }

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

      // Add post_id if reporting a specific post
      if (postId) {
        reportData.post_id = postId;
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
      <DialogContent
        className="w-[90vw] max-w-md mx-auto mobile-container p-0 gap-0 bg-background border border-border shadow-lg rounded-2xl overflow-hidden
        /* Mobile optimizations */
        max-h-[95vh] sm:max-h-[90vh]
        /* Native app safe area support */
        mb-safe
        /* Touch-friendly sizing */
        min-h-[60vh] sm:min-h-auto
        /* Hide close button */
        [&>button]:hidden"
        style={{
          // Native app dynamic spacing
          marginTop: 'max(1rem, env(safe-area-inset-top, 0px))',
          marginBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          // Ensure proper viewport sizing on mobile
          maxHeight: 'calc(100vh - max(2rem, env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)))'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header - Mobile optimized */}
          <div className="bg-background p-4 sm:p-6 text-foreground border-b border-border">
            <DialogHeader className="space-y-2 sm:space-y-3">
              <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl font-bold">
                <div className="p-1.5 sm:p-2 bg-[hsl(var(--romance))] rounded-lg">
                  <Flag className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-white" />
                </div>
                <span className="text-foreground">
                  {messageId ? 'Report Message' : postId ? 'Report Post' : 'Report User'}
                </span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                Report <span className="font-semibold text-foreground">{reportedUserName}</span> for behavior that violates our community guidelines.
                <span className="hidden sm:inline"> All reports are reviewed by our safety team within 24 hours.</span>
                <span className="sm:hidden block mt-1">Reports reviewed within 24 hours.</span>
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Scrollable content area - Mobile optimized */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-4 sm:space-y-6">



              {/* Report type selection - Mobile optimized */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="report-type" className="text-sm sm:text-sm font-semibold text-foreground flex items-center gap-2">
                    <Flag className="h-4 w-4 text-[hsl(var(--romance))]" />
                    Reason for reporting *
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">Choose the category that best describes the issue</p>
                </div>

                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger
                    className="h-11 text-left border hover:border-primary/50 transition-colors
                    /* Mobile touch optimization */
                    min-h-[44px] touch-manipulation"
                  >
                    <SelectValue placeholder="Select a reason..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh] sm:max-h-72">
                    {reportTypes.map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          className="py-2 sm:py-3 hover:bg-accent/50 transition-colors
                          /* Touch optimization */
                          min-h-[44px] touch-manipulation"
                        >
                          <div className="flex items-start gap-2 sm:gap-3 w-full">
                            <div className={`p-1.5 sm:p-2 rounded-lg ${type.color} transition-colors`}>
                              <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 flex-1">
                              <div className="font-semibold text-xs sm:text-sm">{type.label}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed hidden sm:block">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected report type preview */}
              {selectedReportType && (
                <Alert className={`${selectedReportType.color} shadow-sm transition-all duration-300`}>
                  <selectedReportType.icon className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <div className="space-y-1">
                      <div className="font-semibold">{selectedReportType.label} Selected</div>
                      <div className="text-xs opacity-90">{selectedReportType.description}</div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Additional details section - Mobile optimized */}
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[hsl(var(--purple-accent))]" />
                    Additional details <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <span className="hidden sm:inline">Provide specific examples or context to help our review</span>
                    <span className="sm:hidden">Add more details to help our review</span>
                  </p>
                </div>

                <div className="relative">
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Example: This happened when..."
                    className="min-h-[80px] sm:min-h-[100px] resize-none text-sm leading-relaxed border hover:border-primary/50 focus:border-primary transition-colors
                    /* Mobile optimization */
                    touch-manipulation"
                    maxLength={500}
                    rows={3}
                  />
                  <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-muted-foreground bg-background/90 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded backdrop-blur-sm">
                    {description.length}/500
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">All information is kept confidential and secure</span>
                  <span className="sm:hidden">Information kept confidential</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Mobile optimized */}
          <div className="border-t border-border p-4 sm:p-6">
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto h-11 text-sm font-medium border hover:bg-accent/50 transition-all duration-200
                /* Mobile touch optimization */
                min-h-[44px] touch-manipulation"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReport}
                disabled={loading || !reportType}
                className="w-full sm:w-auto h-11 text-sm font-semibold bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                /* Mobile touch optimization */
                min-h-[44px] touch-manipulation"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="hidden sm:inline">Submitting Report...</span>
                    <span className="sm:hidden">Submitting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    <span className="hidden sm:inline">Submit Report</span>
                    <span className="sm:hidden">Submit</span>
                  </div>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};