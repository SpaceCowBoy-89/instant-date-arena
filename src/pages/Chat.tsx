import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Send, Clock, ThumbsUp, ThumbsDown, ArrowLeft, User, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Message {
  id: string;
  text: string;
  sender_id: string;
  timestamp: string;
}

interface ChatData {
  chat_id: string;
  user1_id: string;
  user2_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  photo_url?: string;
  preferences?: {
    interests?: string[];
  };
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [decision, setDecision] = useState<"like" | "pass" | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatStatus, setChatStatus] = useState<'active' | 'ended_by_departure' | 'ended_manually' | 'completed'>('active');
  const [otherUserPresent, setOtherUserPresent] = useState(true);
  const [showUserLeftMessage, setShowUserLeftMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { toast } = useToast();

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

  // Load chat data and user profiles
  useEffect(() => {
    if (!chatId) return;
    loadChatData();
    getCurrentUser();
  }, [chatId]);

  // Set up real-time subscription for chat updates and presence tracking
  useEffect(() => {
    if (!chatId || !currentUser) return;

    const channel = supabase
      .channel(`speed-chat-${chatId}`)
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
              description: `${otherUser?.name || 'The other user'} has left the speed date.`,
              variant: "destructive",
            });
            
            // End the session and redirect to lobby
            setTimeout(() => {
              navigate("/lobby");
            }, 3000);
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
  }, [chatId, currentUser, chatStatus, otherUser]);

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

  // Timer for speed dating
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadChatData = async () => {
    try {
      const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('chat_id', chatId)
        .single();

      if (error) {
        console.error('Error loading chat:', error);
        toast({
          title: "Error",
          description: "Failed to load chat data",
          variant: "destructive",
        });
        navigate("/lobby");
        return;
      }

      setChatData(chat as unknown as ChatData);
      const messagesArray = Array.isArray(chat.messages) ? (chat.messages as unknown as Message[]) : [];
      setMessages(messagesArray);

      // Load current user to determine other user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const otherUserId = user.id === chat.user1_id ? chat.user2_id : chat.user1_id;
        await loadOtherUserProfile(otherUserId);
      }
    } catch (error) {
      console.error('Error in loadChatData:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOtherUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading other user profile:', error);
        return;
      }

      setOtherUser(profile as UserProfile);
    } catch (error) {
      console.error('Error in loadOtherUserProfile:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isTimeUp || !currentUser || !chatData || chatStatus !== 'active') return;

    const messageId = `msg_${Date.now()}`;
    const newMessageObj: Message = {
      id: messageId,
      text: newMessage.trim(),
      sender_id: currentUser.id,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newMessageObj];

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
        return;
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error in sendMessage:', error);
    }
  };

  const handleDecision = async (choice: "like" | "pass") => {
    setDecision(choice);
    
    // TODO: Store decisions in database and check for mutual matches
    // For now, simulate the check
    setTimeout(() => {
      if (choice === "like") {
        // Simulate mutual like - in real app, check backend for mutual match
        const isMutualMatch = Math.random() > 0.5; // 50% chance for demo
        if (isMutualMatch) {
          toast({
            title: "It's a Match! 💕",
            description: "Both of you liked each other! Continue chatting.",
          });
          navigate(`/messages/${chatId}`);
        } else {
          toast({
            title: "Not a Match",
            description: "Better luck next time!",
          });
          navigate("/lobby");
        }
      } else {
        navigate("/lobby");
      }
    }, 2000);
  };

  const handleEndChat = () => {
    setShowEndChatDialog(true);
  };

  const confirmEndChat = () => {
    navigate("/lobby");
  };

  const progressPercentage = ((180 - timeLeft) / 180) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chatData || !otherUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Chat not found</p>
          <Button onClick={() => navigate("/lobby")} className="mt-4">
            Return to Lobby
          </Button>
        </div>
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
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-20">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/lobby")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-romance" />
                <span className={`font-mono text-lg font-bold ${timeLeft < 30 ? "text-destructive" : "text-romance"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Progress value={progressPercentage} className="w-32 h-2" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndChat}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="pt-24 px-4 pb-20" style={{ height: `calc(100vh - ${Math.max(keyboardHeight, 80)}px)` }}>
        <div className="container mx-auto max-w-4xl h-full">
          <div className="grid lg:grid-cols-4 gap-4 h-full">
            {/* Match Info Sidebar */}
            <div className="lg:col-span-1">
              <Card className="h-full max-h-96 lg:max-h-full overflow-y-auto">
                <CardHeader className="text-center pb-3">
                  <Avatar className="h-16 w-16 lg:h-20 lg:w-20 mx-auto mb-2">
                    <AvatarImage src={otherUser.photo_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white text-lg">
                      <User className="h-6 w-6 lg:h-8 lg:w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-base lg:text-lg">
                    {otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ''}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {otherUser.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Bio</p>
                      <p className="text-sm">{otherUser.bio}</p>
                    </div>
                  )}
                  {otherUser.preferences?.interests && otherUser.preferences.interests.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {otherUser.preferences.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3 flex flex-col h-full">
              <Card className="flex-1 flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Heart className="h-5 w-5 text-romance fill-romance" />
                    Speed Date Chat
                  </CardTitle>
                </CardHeader>
                
                 {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-4 pr-8">
                      {showUserLeftMessage && (
                        <div className="text-center py-4">
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
                            <p className="text-destructive font-medium">
                              {otherUser?.name || 'The other user'} has left the speed date.
                            </p>
                            <p className="text-muted-foreground text-sm mt-1">
                              You'll be redirected to the lobby shortly.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          <p>Say hello to start your speed date! 👋</p>
                        </div>
                      ) : (
                        messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[280px] lg:max-w-sm px-4 py-2 rounded-lg ${
                                message.sender_id === currentUser?.id
                                  ? "bg-gradient-to-r from-romance to-purple-accent text-white"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Input/Decision Area at Bottom */}
      <div 
        className="fixed left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-30"
        style={{ 
          bottom: `${Math.max(keyboardHeight, 80)}px`,
        }}
      >
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {!isTimeUp ? (
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" variant="romance" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="text-center">
              {decision ? (
                <div className="space-y-4">
                  <p className="text-lg font-semibold">
                    {decision === "like" ? "Great choice! 💕" : "Thanks for being honest! 👍"}
                  </p>
                   <p className="text-muted-foreground">
                     {decision === "like" 
                       ? `Checking if ${otherUser.name} likes you too...`
                       : "You'll be returned to the lobby to find another match."
                     }
                   </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Time's up! ⏰</h3>
                  <p className="text-muted-foreground">
                    What did you think of your conversation with {otherUser.name}?
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="soft"
                      onClick={() => handleDecision("pass")}
                      className="flex items-center gap-2"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      Not a match
                    </Button>
                    <Button
                      variant="romance"
                      onClick={() => handleDecision("like")}
                      className="flex items-center gap-2"
                    >
                      <Heart className="h-4 w-4" />
                      I liked them!
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* End Chat Confirmation Dialog */}
      <AlertDialog open={showEndChatDialog} onOpenChange={setShowEndChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Speed Date?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this speed date early? You won't be able to continue the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndChat} className="bg-destructive hover:bg-destructive/90">
              End Chat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Fixed Navbar at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <Navbar />
      </div>
    </div>
  );
};

export default Chat;
