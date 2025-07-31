import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== "delete") {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE' to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    
    try {
      // Call the deletion request function
      const { data, error } = await supabase.rpc('request_account_deletion');

      if (error) {
        throw error;
      }

      const result = data as { success?: boolean; error?: string };
      if (!result?.success) {
        throw new Error(result?.error || 'Failed to request account deletion');
      }

      toast({
        title: "Deletion Requested",
        description: "Your account will be permanently deleted within 90 days. You will receive confirmation via email.",
      });

      // Redirect to account deletion page for more info
      navigate("/account-deletion-request");
      
    } catch (error) {
      console.error("Delete account request error:", error);
      toast({
        title: "Error",
        description: "Failed to request account deletion. Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      onOpenChange(false);
      setConfirmText("");
    }
  };

  const handleCancel = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Delete Account
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-4">
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              <p>
                This includes:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Your profile and photos</li>
                <li>All your matches and conversations</li>
                <li>Your preferences and settings</li>
                <li>Your account history</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Type <strong>DELETE</strong> to confirm:
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isDeleting || confirmText.toLowerCase() !== "delete"}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};