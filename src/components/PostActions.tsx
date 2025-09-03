import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Flag } from "lucide-react";
import { ReportUserDialog } from "@/components/ReportUserDialog";

interface PostActionsProps {
  postId: string;
  postUserId: string;
  postUserName: string;
  postContent: string;
  currentUserId: string;
  groupId: string;
}

export const PostActions = ({
  postId,
  postUserId,
  postUserName,
  postContent,
  currentUserId,
  groupId
}: PostActionsProps) => {
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleReport = () => {
    setShowReportDialog(true);
  };

  return (
    <>
      <div className="flex items-center justify-end pt-2">
        {/* Show report option only for posts from other users */}
        {postUserId !== currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-xs">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReport}>
                <Flag className="h-3 w-3 mr-2" />
                Report Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ReportUserDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={postUserId}
        reportedUserName={postUserName}
        messageId={postId}
        messageContent={postContent}
      />
    </>
  );
};