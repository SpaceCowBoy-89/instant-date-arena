import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MoreVertical, Flag, Ban } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportUserDialog } from "@/components/ReportUserDialog";
import { BlockUserDialog } from "@/components/BlockUserDialog";

interface GroupMember {
  id: string;
  name: string;
  photo_url?: string;
}

interface GroupMessage {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  users: {
    name: string;
    photo_url?: string;
  };
}

interface ConnectionsGroupProps {
  groupId: string;
  groupName: string;
  groupSubtitle: string;
  userId: string;
}

const ConnectionsGroup = ({ groupId, groupName, groupSubtitle, userId }: ConnectionsGroupProps) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reportDialog, setReportDialog] = useState<{ 
    open: boolean; 
    userId: string; 
    userName: string;
    messageId?: string;
    messageContent?: string;
  }>({
    open: false,
    userId: "",
    userName: "",
    messageId: undefined,
    messageContent: undefined
  });
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; userId: string; userName: string }>({
    open: false,
    userId: "",
    userName: ""
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadGroupData();
    
    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('connections_group_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'connections_group_messages',
        filter: `group_id=eq.${groupId}`
      }, (payload) => {
        loadMessages(); // Reload messages when new ones arrive
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
    };
  }, [groupId]);

  const loadGroupData = async () => {
    await Promise.all([loadMembers(), loadMessages()]);
    setLoading(false);
  };

  const loadMembers = async () => {
    try {
      const { data: memberData, error } = await supabase
        .from('user_connections_groups')
        .select('user_id')
        .eq('group_id', groupId);

      if (error) throw error;

      if (memberData && memberData.length > 0) {
        const userIds = memberData.map(m => m.user_id);
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, photo_url')
          .in('id', userIds);

        if (userError) throw userError;

        setMembers(userData || []);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast({
        title: "Error",
        description: "Failed to load group members",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async () => {
    try {
      const { data: messageData, error } = await supabase
        .from('connections_group_messages')
        .select('id, user_id, message, created_at')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      if (messageData && messageData.length > 0) {
        const userIds = [...new Set(messageData.map(m => m.user_id))];
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, photo_url')
          .in('id', userIds);

        if (userError) throw userError;

        const messagesWithUsers = messageData.map(message => ({
          ...message,
          users: userData?.find(user => user.id === message.user_id) || { name: 'Unknown User', photo_url: null }
        }));

        setMessages(messagesWithUsers);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('connections_group_messages')
        .insert({
          group_id: groupId,
          user_id: userId,
          message: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage("");
      // Messages will be updated via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReportMessage = (reportedUserId: string, reportedUserName: string, messageId: string, messageContent: string) => {
    setReportDialog({
      open: true,
      userId: reportedUserId,
      userName: reportedUserName,
      messageId: messageId,
      messageContent: messageContent
    });
  };

  const handleReportUser = (reportedUserId: string, reportedUserName: string) => {
    setReportDialog({
      open: true,
      userId: reportedUserId,
      userName: reportedUserName,
      messageId: undefined,
      messageContent: undefined
    });
  };

  const handleBlockUser = (blockedUserId: string, blockedUserName: string) => {
    setBlockDialog({
      open: true,
      userId: blockedUserId,
      userName: blockedUserName
    });
  };

  const formatGroupName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {formatGroupName(groupName)}
          </CardTitle>
          <CardDescription className="text-base">
            {groupSubtitle}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Group Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex flex-col items-center gap-2 cursor-pointer group"
                onClick={() => navigate(`/profile/${member.id}`)}
              >
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-border group-hover:border-primary transition-colors">
                    <AvatarImage src={member.photo_url} />
                    <AvatarFallback className="text-sm font-medium">
                      {member.name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <span className="text-xs text-center font-medium leading-tight">
                  {member.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Group Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Group Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-80 w-full border rounded-md p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="flex items-start gap-3 group">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={message.users?.photo_url} />
                        <AvatarFallback className="text-xs">
                          {message.users?.name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.users?.name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                          {message.user_id !== userId && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleReportMessage(message.user_id, message.users?.name || 'Unknown User', message.id, message.message)}>
                                  <Flag className="h-4 w-4 mr-2" />
                                  Report Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBlockUser(message.user_id, message.users?.name || 'Unknown User')}>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Block User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                        <p className="text-sm text-foreground break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sendingMessage}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Dialog */}
      <ReportUserDialog
        open={reportDialog.open}
        onOpenChange={(open) => setReportDialog(prev => ({ ...prev, open }))}
        reportedUserId={reportDialog.userId}
        reportedUserName={reportDialog.userName}
        messageId={reportDialog.messageId}
        messageContent={reportDialog.messageContent}
      />

      {/* Block Dialog */}
      <BlockUserDialog
        open={blockDialog.open}
        onOpenChange={(open) => setBlockDialog(prev => ({ ...prev, open }))}
        blockedUserId={blockDialog.userId}
        blockedUserName={blockDialog.userName}
        onUserBlocked={() => {
          loadMembers(); // Refresh members list
          loadMessages(); // Refresh messages
        }}
      />
    </div>
  );
};

export default ConnectionsGroup;