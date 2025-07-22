import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Heart, Send, ArrowLeft, User, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Message {
  id: string;
  text: string;
  sender_id: string;
  timestamp: string;
}

interface OtherUser {
  id: string;
  name: string;
  age?: number;
  photo_url?: string;
  bio?: string;
  location?: string;
  preferences?: any;
}

const ChatView = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatStatus, setChatStatus] = useState<'active' | 'ended_by_departure' | 'ended_manually' | 'completed'>('active');
  const [otherUserPresent, setOtherUserPresent] = useState(true);
  const [showUserLeftMessage, setShowUserLeftMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      loadChat();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle mobile keyboard for iOS and Android
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        setKeyboardHeight(keyboardHeight > 100 ? keyboardHeight : 0);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  // Set up real-time subscription for chat updates and presence tracking
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('Real-time chat update:', payload);
          if (payload.new && payload.new.messages) {
            const updatedMessages = Array.isArray(payload.new.messages) 
              ? (payload.new.messages as unknown as Message[]) 
              : [];
            setMessages(updatedMessages);
          }
          
          // Check if chat was ended by departure
          if (payload.new && payload.new.status === 'ended_by_departure') {
            setChatStatus('ended_by_departure');
            setOtherUserPresent(false);
            setShowUserLeftMessage(true);
            
            toast({
              title: "User Left",
              description: `${otherUser?.name || 'The other user'} has left the chat.`,
              variant: "destructive",
            });
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState();
        const userCount = Object.keys(presenceState).length;
        setOtherUserPresent(userCount > 1);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        setOtherUserPresent(true);
        if (showUserLeftMessage) {
          setShowUserLeftMessage(false);
          setChatStatus('active');
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const presenceState = channel.presenceState();
        const userCount = Object.keys(presenceState).length;
        
        if (userCount <= 1 && chatStatus === 'active') {
          handleUserDeparture();
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track user presence
          await channel.track({
            user_id: currentUser.id,
            user_name: currentUser.user_metadata?.name || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, chatStatus, otherUser, showUserLeftMessage]);

  // Handle user departure
  const handleUserDeparture = async () => {
    if (!chatId || !currentUser || chatStatus !== 'active') return;
    
    try {
      // Update chat status to ended by departure
      const { error } = await supabase
        .from('chats')
        .update({ 
          status: 'ended_by_departure',
          ended_at: new Date().toISOString(),
          ended_by: currentUser.id
        })
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error updating chat status:', error);
        return;
      }

      setChatStatus('ended_by_departure');
      setOtherUserPresent(false);
      setShowUserLeftMessage(true);
    } catch (error) {
      console.error('Error in handleUserDeparture:', error);
    }
  };

  // Handle page unload (user leaving)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (chatStatus === 'active') {
        handleUserDeparture();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [chatStatus]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      setCurrentUser(user);

      // Load chat data
      const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('chat_id', chatId)
        .single();

      if (error || !chat) {
        console.error('Error loading chat:', error);
        toast({
          title: "Error",
          description: "Chat not found",
          variant: "destructive",
        });
        navigate("/messages");
        return;
      }

      // Verify user is part of this chat
      if (chat.user1_id !== user.id && chat.user2_id !== user.id) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this chat",
          variant: "destructive",
        });
        navigate("/messages");
        return;
      }

      // Get other user's info
      const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
      const { data: otherUserData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', otherUserId)
        .single();

      if (userError || !otherUserData) {
        console.error('Error loading other user:', userError);
        toast({
          title: "Error",
          description: "Failed to load user information",
          variant: "destructive",
        });
        navigate("/messages");
        return;
      }

      setOtherUser(otherUserData);
      
      // Safely handle messages array
      const chatMessages = Array.isArray(chat.messages) ? (chat.messages as unknown as Message[]) : [];
      setMessages(chatMessages);
    } catch (error) {
      console.error('Error in loadChat:', error);
      toast({
        title: "Error",
        description: "Failed to load chat",
        variant: "destructive",
      });
      navigate("/messages");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !chatId || chatStatus !== 'active') return;

    const message: Message = {
      id: `msg_${Date.now()}`,
      text: newMessage.trim(),
      sender_id: currentUser.id,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage("");

    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          messages: updatedMessages as any,
          updated_at: new Date().toISOString()
        })
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        // Revert the message
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setMessages(messages);
    }
  };

  const handleUnmatch = async () => {
    if (!chatId) return;

    try {
      // Delete the chat from the database
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('chat_id', chatId);

      if (error) {
        console.error('Error deleting chat:', error);
        toast({
          title: "Error",
          description: "Failed to unmatch. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Unmatched",
        description: "You have unmatched with this user. The conversation has been deleted.",
      });
      navigate("/messages");
    } catch (error) {
      console.error('Error unmatching:', error);
      toast({
        title: "Error",
        description: "Failed to unmatch",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex items-center justify-center">
        <div className="text-muted-foreground">Loading chat...</div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex items-center justify-center">
        <div className="text-muted-foreground">User not found</div>
      </div>
    );
  }

  return (
    <div 
      className="relative bg-gradient-to-br from-background via-secondary/50 to-muted"
      style={{ 
        height: '100vh',
        paddingBottom: `${Math.max(keyboardHeight, 80)}px` 
      }}
    >
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 border-b border-border bg-background/95 backdrop-blur-sm z-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/messages")}
                className="h-10 w-10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={otherUser.photo_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-foreground">{otherUser.name}</h2>
                    {otherUser.age && (
                      <Badge variant="secondary" className="text-xs">{otherUser.age}</Badge>
                    )}
                  </div>
                  {otherUser.location && (
                    <p className="text-xs text-muted-foreground">{otherUser.location}</p>
                  )}
                  {otherUser.preferences?.interests && otherUser.preferences.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {otherUser.preferences.interests.slice(0, 2).map((interest: string) => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <UserMinus className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unmatch with {otherUser.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. You will no longer be able to see this conversation
                    or send messages to each other.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnmatch} className="bg-destructive hover:bg-destructive/90">
                    Unmatch
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>


      {/* Messages Area */}
       <div className="pt-20 px-4 pb-20" style={{ height: `calc(100vh - 120px - ${Math.max(keyboardHeight, 80)}px)` }}>
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <div className="space-y-4 py-4 pr-4 min-h-full">
            {showUserLeftMessage && (
              <div className="text-center py-4">
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-destructive font-medium">
                    {otherUser?.name || 'The other user'} has left the chat.
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    They may come back later to continue the conversation.
                  </p>
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[280px] lg:max-w-sm px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser?.id
                      ? 'bg-romance text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === currentUser?.id ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      </div>

      {/* Fixed Input at Bottom */}
      <div 
        className="fixed left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-30"
        style={{ 
          bottom: `${Math.max(keyboardHeight, 80)}px`,
        }}
      >
        <div className="p-4">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              variant="romance"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Fixed Navbar at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <Navbar />
      </div>
    </div>
  );
};

export default ChatView;
