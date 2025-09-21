import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertTriangle, Shield, Clock, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const AccountDeletionRequest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleDeleteRequest = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('request_account_deletion');

      if (error) {
        throw error;
      }

      const result = data as { success?: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to request account deletion');
      }

      toast({
        title: "Deletion Request Submitted",
        description: "Your account will be permanently deleted within 90 days. You will receive confirmation via email.",
      });

      // Redirect to settings page
      navigate("/settings");
      
    } catch (error) {
      console.error("Account deletion request error:", error);
      toast({
        title: "Error",
        description: "Failed to submit deletion request. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Account Deletion Request
            </h1>
            <p className="text-muted-foreground">
              Request permanent deletion of your Mopa account and associated data
            </p>
          </div>

          {/* Warning Card */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Once you request account deletion, your account and all associated data will be permanently removed from our systems.
              </p>
            </CardContent>
          </Card>

          {/* Steps Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How to Request Account Deletion
              </CardTitle>
              <CardDescription>
                Follow these steps to permanently delete your Mopa account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Review what will be deleted</p>
                    <p className="text-sm text-muted-foreground">
                      All your profile data, photos, matches, conversations, and preferences will be permanently removed.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Click "Request Account Deletion"</p>
                    <p className="text-sm text-muted-foreground">
                      Submit your deletion request through the button below.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Wait for processing</p>
                    <p className="text-sm text-muted-foreground">
                      Your account will be permanently deleted within 90 days of your request.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Data Retention Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm mb-2">Data That Will Be Deleted:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Your profile information (name, age, bio, photos)</li>
                  <li>All matches and conversation history</li>
                  <li>Your preferences and settings</li>
                  <li>Verification records and status</li>
                  <li>Account activity history</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Retention Period:</h4>
                <p className="text-sm text-muted-foreground">
                  Your data will be permanently deleted within <strong>90 days</strong> of your deletion request. 
                  This retention period allows us to:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside mt-2">
                  <li>Process any pending transactions or disputes</li>
                  <li>Comply with legal and regulatory requirements</li>
                  <li>Allow you to recover your account if you change your mind</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Data That May Be Retained:</h4>
                <p className="text-sm text-muted-foreground">
                  For legal compliance, we may retain anonymized aggregate data and certain records required by law, 
                  but these will not be personally identifiable.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isLoading}
              variant="destructive"
              size="lg"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              {isLoading ? "Processing..." : "Request Account Deletion"}
            </Button>
          </div>

          {/* Support Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h4 className="font-medium mb-2">Need Help?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have questions about account deletion or need assistance, please contact our support team.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/support/contact")}
                >
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Confirm Account Deletion Request
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <p>
                  Are you absolutely sure you want to request deletion of your Mopa account? 
                  This action will:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Permanently delete all your data within 90 days</li>
                  <li>Remove your profile from the platform immediately</li>
                  <li>Cancel all active matches and conversations</li>
                  <li>Cannot be reversed once processed</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequest}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Submitting..." : "Yes, Request Deletion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AccountDeletionRequest;