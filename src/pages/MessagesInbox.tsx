import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import SwipeableCard from "@/components/SwipeableCard";


interface ChatThread {
  chat_id: string;
  other_user: {
    id: string;
    name: string;
    photo_url?: string;
    age?: number;
  };
  last_message: {
    text: string;
    timestamp: string;
    sender_id: string;
  } | null;
  updated_at: string;
}

const MessagesInbox = () => {
  const [conversations, setConversations] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ChatThread | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Current user in MessagesInbox:', user);
      
      if (!user) {
        navigate("/");
        return;
      }

      // Get only completed chats (mutual matches) with actual messages
      const { data: chats, error } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'completed')
        .not('messages', 'eq', '[]')
        .order('updated_at', { ascending: false });

      console.log('Chats query result:', { chats, error, userId: user.id });

      if (error) {
        console.error('Error loading conversations:', error);
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        });
        return;
      }

      if (!chats || chats.length === 0) {
        setConversations([]);
        return;
      }

      // Get other users' info for each chat
      const otherUserIds = chats.map(chat => 
        chat.user1_id === user.id ? chat.user2_id : chat.user1_id
      );

      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, photo_url, age')
        .in('id', otherUserIds);

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast({
          title: "Error",
          description: "Failed to load user information",
          variant: "destructive",
        });
        return;
      }

      // Combine chat data with user info
      const threads: ChatThread[] = chats.map(chat => {
        const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
        const otherUser = users?.find(u => u.id === otherUserId);
        
        // Get the last message from the messages array
        const messages = Array.isArray(chat.messages) ? (chat.messages as any[]) : [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

        return {
          chat_id: chat.chat_id,
          other_user: {
            id: otherUserId,
            name: otherUser?.name || "Unknown User",
            photo_url: otherUser?.photo_url,
            age: otherUser?.age,
          },
          last_message: lastMessage,
          updated_at: chat.updated_at,
        };
      });

      setConversations(threads);
    } catch (error) {
      console.error('Error in loadConversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConversation = (conversation: ChatThread) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('chat_id', conversationToDelete.chat_id);

      if (error) {
        console.error('Error deleting conversation:', error);
        toast({
          title: "Error",
          description: "Failed to delete conversation. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Remove from local state
      setConversations(prev => 
        prev.filter(conv => conv.chat_id !== conversationToDelete.chat_id)
      );

      toast({
        title: "Conversation Deleted",
        description: `Conversation with ${conversationToDelete.other_user.name} has been deleted.`,
      });

      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/lobby")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground">Your conversations</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

           {/* Conversations List */}
           <div className="space-y-4">
             {filteredConversations.length === 0 ? (
               <Card>
                 <CardContent className="flex flex-col items-center justify-center py-12">
                   <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                   <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                   <p className="text-muted-foreground text-center mb-4">
                     Start speed dating to find matches and begin conversations!
                   </p>
                     <Button variant="romance" onClick={() => navigate("/")}>
                       Start Speed Dating
                     </Button>
                 </CardContent>
               </Card>
            ) : (
              filteredConversations.map((conversation) => (
                <SwipeableCard
                  key={conversation.chat_id}
                  onDelete={() => handleDeleteConversation(conversation)}
                  className="animate-fade-in"
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/messages/${conversation.chat_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.other_user.photo_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white">
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate">
                                {conversation.other_user.name}
                              </h3>
                              {conversation.other_user.age && (
                                <Badge variant="secondary" className="text-xs">
                                  {conversation.other_user.age}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.last_message?.timestamp || conversation.updated_at)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.last_message?.text || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </SwipeableCard>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your conversation with {conversationToDelete?.other_user.name}? 
              This action cannot be undone and will unmatch you from this user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setConversationToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteConversation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Conversation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Navbar />
    </div>
  );
};

export default MessagesInbox;