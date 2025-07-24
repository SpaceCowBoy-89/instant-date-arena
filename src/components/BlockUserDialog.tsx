import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockedUserId: string;
  blockedUserName?: string;
  onUserBlocked?: () => void;
}

export const BlockUserDialog = ({ 
  open, 
  onOpenChange, 
  blockedUserId, 
  blockedUserName = "this user",
  onUserBlocked 
}: BlockUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBlockUser = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to block a user.",
          variant: "destructive",
        });
        return;
      }

      // Check if already blocked
      const { data: existingBlock } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId)
        .maybeSingle();

      if (existingBlock) {
        toast({
          title: "Already Blocked",
          description: `${blockedUserName} is already blocked.`,
        });
        onOpenChange(false);
        return;
      }

      const { error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: user.id,
          blocked_id: blockedUserId
        });

      if (error) {
        console.error('Block user error:', error);
        toast({
          title: "Block Failed",
          description: "Failed to block user. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "User Blocked",
        description: `${blockedUserName} has been blocked. You won't see them in matches or receive messages from them.`,
      });

      onUserBlocked?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Block error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto mobile-container">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <UserX className="h-5 w-5 text-red-500 shrink-0" />
            Block User
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Are you sure you want to block {blockedUserName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="text-sm font-medium">When you block {blockedUserName}:</p>
                <ul className="text-sm space-y-2 ml-1">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>They won't appear in your matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>They can't send you messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>You won't see their profile</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>They won't know they've been blocked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>You can unblock them later in Safety Center</span>
                  </li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto h-12 text-sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleBlockUser}
            disabled={loading}
            variant="destructive"
            className="w-full sm:w-auto h-12 text-sm font-medium"
          >
            {loading ? "Blocking..." : `Block ${blockedUserName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};