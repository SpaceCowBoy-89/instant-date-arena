import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IOSSafeDropdown, IOSSafeDropdownItem } from "@/components/ui/ios-safe-dropdown";
import { Heart, MessageCircle, Share2, MoreVertical, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ReportUserDialog } from "@/components/ReportUserDialog";

interface PostActionsProps {
  postId: string;
  postUserId: string;
  postUserName: string;
  postContent: string;
  initialLikes: number;
  initialComments: number;
  currentUserId: string;
  groupId: string;
}

export const PostActions = ({
  postId,
  postUserId,
  postUserName,
  postContent,
  initialLikes,
  initialComments,
  currentUserId,
  groupId
}: PostActionsProps) => {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { toast } = useToast();

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikes(prev => prev - 1);
      toast({
        title: "Post unliked",
        description: "You removed your like from this post",
      });
    } else {
      setLiked(true);
      setLikes(prev => prev + 1);
      toast({
        title: "Post liked",
        description: "You liked this post",
      });
    }
  };

  const handleComment = () => {
    toast({
      title: "Comments coming soon",
      description: "The comment feature will be available soon!",
    });
  };

  const handleShare = () => {
    // Copy to clipboard or show share options
    navigator.clipboard.writeText(`Check out this post in ${groupId}`).then(() => {
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Share",
        description: "Share feature coming soon!",
      });
    });
  };

  const handleReport = () => {
    setShowReportDialog(true);
  };

  return (
    <>
      <div className="flex items-center gap-4 pt-2">
        <Button
          variant="ghost"
          size="sm"
          className={`text-xs ${liked ? 'text-red-500' : ''}`}
          onClick={handleLike}
        >
          <Heart className={`h-3 w-3 mr-1 ${liked ? 'fill-current' : ''}`} />
          {likes}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={handleComment}
        >
          <MessageCircle className="h-3 w-3 mr-1" />
          {initialComments}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={handleShare}
        >
          <Share2 className="h-3 w-3 mr-1" />
          Share
        </Button>

        {/* Show report option only for posts from other users */}
        {postUserId !== currentUserId && (
          <IOSSafeDropdown
            title="Post Options"
            trigger={
              <Button variant="ghost" size="sm" className="text-xs ml-auto min-h-[44px] min-w-[44px] h-10 w-10 touch-target">
                <MoreVertical className="h-3 w-3" />
              </Button>
            }
          >
            <IOSSafeDropdownItem onClick={handleReport}>
              <Flag className="h-3 w-3 mr-2" />
              Report Post
            </IOSSafeDropdownItem>
          </IOSSafeDropdown>
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