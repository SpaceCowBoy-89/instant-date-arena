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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { toast } = useToast();

  // Load chat data and user profiles
  useEffect(() => {
    if (!chatId) return;
    loadChatData();
    getCurrentUser();
  }, [chatId]);

  // Set up real-time subscription for chat updates
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel('speed-chat-messages')
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

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
    if (!newMessage.trim() || isTimeUp || !currentUser || !chatData) return;

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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted pb-24 md:pb-20">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
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

        <div className="flex flex-col lg:grid lg:grid-cols-5 gap-4 h-[calc(100vh-14rem)] md:h-[calc(100vh-12rem)]">
          {/* Match Info Sidebar - Smaller on mobile */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="h-auto lg:h-full">
              <CardHeader className="text-center">
                <Avatar className="h-16 w-16 lg:h-20 lg:w-20 mx-auto mb-2">
                  <AvatarImage src={otherUser.photo_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white text-lg lg:text-xl">
                    <User className="h-6 w-6 lg:h-8 lg:w-8" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-base lg:text-lg">
                  {otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 lg:space-y-4">
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

          {/* Chat Area - Takes priority on mobile */}
          <div className="lg:col-span-4 flex flex-col order-1 lg:order-2 flex-1">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5 text-romance fill-romance" />
                  Speed Date Chat
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
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
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
              </CardContent>

              {/* Message Input or Decision */}
              {!isTimeUp ? (
                <div className="border-t p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                </div>
              ) : (
                <div className="border-t p-6 text-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            </Card>
          </div>
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
      
      <Navbar />
    </div>
  );
};

export default Chat;