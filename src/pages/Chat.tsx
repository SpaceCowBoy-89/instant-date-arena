import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Send, Clock, ThumbsUp, ThumbsDown, ArrowLeft, User, X, MoreVertical, Flag, UserX } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import { ReportUserDialog } from "@/components/ReportUserDialog";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Interfaces
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
  messages: any;
  temporary_messages: any;
  timer_start_time: string;
  status: 'active' | 'ended_by_departure' | 'ended_manually' | 'completed';
  created_at: string;
  updated_at: string;
  ended_at?: string;
  ended_by?: string;
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

// Helper function
const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// The Chat Component
const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [decision, setDecision] = useState<"like" | "pass" | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEndChatDialog, setShowEndChatDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [chatStatus, setChatStatus] = useState<'active' | 'ended_by_departure' | 'ended_manually' | 'completed'>('active');
  const [showUserLeftMessage, setShowUserLeftMessage] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const departureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Auto-scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // --- HOOKS ---

  // Initial Data Loading
  useEffect(() => {
    const initialize = async () => {
      await getCurrentUser();
      if (chatId) {
        await loadChatData();
      }
    };
    initialize();
  }, [chatId]);

  // Real-time Subscription
  useEffect(() => {
    if (!chatId || !currentUser) return;

    console.log('🚀 Setting up real-time subscription for chat:', chatId);
    const channel = supabase.channel(`chat:${chatId}`);

    channel
      .on<ChatData>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chats', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          console.log('🔄 Real-time chat update received:', payload.new);
          const newChatData = payload.new;
          
          setChatData(newChatData);
          setChatStatus(newChatData.status);

          const tempMessages = Array.isArray(newChatData.temporary_messages) ? newChatData.temporary_messages : [];
          const permMessages = Array.isArray(newChatData.messages) ? newChatData.messages : [];
          const messagesToShow = newChatData.status === 'completed' ? permMessages : tempMessages;
          setMessages(messagesToShow);

          if (newChatData.status !== 'active' && !showUserLeftMessage) {
              setShowUserLeftMessage(true);
              const endReason = newChatData.status === 'ended_manually' ? 'ended the chat' : 'left the speed date';
              toast({
                  title: newChatData.status === 'ended_manually' ? "Chat Ended" : "User Left",
                  description: `${otherUser?.name || 'The other user'} ${endReason}.`,
                  variant: "destructive",
              });
              setTimeout(() => navigate("/lobby"), 3000);
           }
          if (newChatData.status === 'completed') {
            // Only navigate if this is a new match (not already on messages page)
            setTimeout(() => {
              navigate(`/messages/${chatId}`);
            }, 1500); // Give time for user to see the match toast
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
        }
      });

    return () => {
      console.log('🧹 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, otherUser?.name]); // Simplified dependencies

  // Timer
  useEffect(() => {
    if (!chatData?.timer_start_time || chatStatus !== 'active') return;
    const timer = setInterval(() => {
      const startTime = new Date(chatData.timer_start_time).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsTimeUp(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [chatData?.timer_start_time, chatStatus]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // --- DATA FETCHING ---

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadChatData = async () => {
    if (!chatId) return;
    setLoading(true);
    try {
      const { data: chat, error } = await supabase.from('chats').select('*').eq('chat_id', chatId).single();
      if (error || !chat) {
        toast({ title: "Error", description: "Chat not found.", variant: "destructive" });
        navigate("/lobby");
        return;
      }
      
      const chatResult = chat as ChatData;
      setChatData(chatResult);
      setChatStatus(chatResult.status);
      
      const tempMessages = Array.isArray(chatResult.temporary_messages) ? chatResult.temporary_messages : [];
      const permMessages = Array.isArray(chatResult.messages) ? chatResult.messages : [];
      setMessages(chatResult.status === 'completed' ? permMessages : tempMessages);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const otherUserId = user.id === chatResult.user1_id ? chatResult.user2_id : chatResult.user1_id;
        await loadOtherUserProfile(otherUserId);
      }
    } catch (err) {
      console.error("Error loading chat data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadOtherUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) console.error('Error loading other user:', error);
    else setOtherUser(profile as UserProfile);
  };

  // --- CORE FUNCTIONS ---

  /**
   * CORRECTED: Sends a message by calling the 'append_message' Postgres function.
   * This is atomic and prevents race conditions.
   */
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !chatId || chatStatus !== 'active') return;

    const newMessageObj: Message = {
      id: `msg_${Date.now()}_${currentUser.id}`, // Unique ID for optimistic update
      text: newMessage.trim(),
      sender_id: currentUser.id,
      timestamp: new Date().toISOString(),
    };
    
    // Optimistically update the UI for a snappy feel
    setMessages(prev => [...prev, newMessageObj]);
    setNewMessage("");

    // Call the database function to atomically append the message
    const { error } = await supabase.rpc('append_message', {
      chat_id_param: chatId,
      message_param: newMessageObj as any,
    });

    if (error) {
      console.error('❌ Error sending message:', error);
      toast({ title: "Error", description: "Message failed to send.", variant: "destructive" });
      // If the DB call fails, remove the optimistic message
      setMessages(prev => prev.filter(m => m.id !== newMessageObj.id));
    }
  };

  const handleDecision = async (choice: "like" | "pass") => {
    if (!currentUser || !otherUser || !chatId) return;
    setDecision(choice);

    // Use atomic function to handle interaction and match detection
    const { data, error } = await supabase.rpc('handle_user_interaction', {
      p_user_id: currentUser.id,
      p_target_user_id: otherUser.id,
      p_interaction_type: choice === 'like' ? 'like' : 'reject',
      p_chat_id: chatId
    });

    if (error) {
      console.error('Error handling user interaction:', error);
      toast({ title: "Error", description: "Failed to record decision.", variant: "destructive" });
      return;
    }

    console.log('Interaction result:', data);

    // Show appropriate feedback based on the result
    if (choice === 'like') {
      const resultData = data as any;
      if (resultData?.is_mutual_match) {
        toast({
          title: "It's a Match! 💕",
          description: "You both liked each other! Moving to messages...",
        });
        // Don't navigate here - let the real-time subscription handle it
      } else {
        toast({
          title: "Decision recorded",
          description: "Waiting for the other person to decide...",
        });
      }
    }

    // If it's a pass and no mutual match, end the chat manually
    if (choice === 'pass') {
      await supabase.from('chats').update({ 
        status: 'ended_manually', 
        ended_by: currentUser.id,
        ended_at: new Date().toISOString()
      }).eq('chat_id', chatId);
    }
  };

  const confirmEndChat = async () => {
    if (!chatId || !currentUser) return;
    await supabase.from('chats').update({ 
        status: 'ended_manually', 
        ended_by: currentUser.id,
        ended_at: new Date().toISOString()
    }).eq('chat_id', chatId);
  };
  
  // --- UI & RENDER ---

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><p>Loading Chat...</p></div>;
  }

  if (!chatData || !otherUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-destructive">Chat not found or has expired.</p>
        <Button onClick={() => navigate("/lobby")} className="mt-4">Return to Lobby</Button>
      </div>
    );
  }

  const progressPercentage = ((180 - timeLeft) / 180) * 100;
  const isChatActive = chatStatus === 'active';

  return (
    <div className="relative bg-gradient-to-br from-background via-secondary/50 to-muted h-screen overflow-hidden flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-20 pt-safe">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate("/lobby")}><ArrowLeft className="h-5 w-5" /></Button>
            <div className="text-center">
              <h1 className="text-lg font-semibold mb-2">Speed Date Chat</h1>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-primary" />
                <span className={`font-mono text-lg font-bold ${timeLeft < 30 ? "text-destructive" : "text-primary"}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <Progress value={progressPercentage} className="w-32 h-2" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!isChatActive}><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}><Flag className="h-4 w-4 mr-2" />Report User</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBlockDialog(true)}><UserX className="h-4 w-4 mr-2" />Block User</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowEndChatDialog(true)} className="text-destructive"><X className="h-4 w-4 mr-2" />End Chat</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col" style={{ paddingTop: '7rem' }}>
        <div className="container mx-auto max-w-4xl flex-1 flex flex-col px-4 pb-4">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b flex-shrink-0 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarImage src={otherUser.photo_url} /><AvatarFallback><User /></AvatarFallback></Avatar>
                <div>
                  <h3 className="font-semibold">{otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ''}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {otherUser.preferences?.interests?.slice(0, 3).map(i => <Badge key={i} variant="secondary">{i}</Badge>)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-4 p-4 pb-6">
                  {showUserLeftMessage ? (
                    <div className="text-center py-4">
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-destructive font-medium">This chat has ended.</p>
                        <p className="text-muted-foreground text-sm mt-1">You will be redirected to the lobby.</p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8"><p>Time is ticking! Say hello to start your speed date! 👋</p></div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] px-4 py-2 rounded-lg ${message.sender_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
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
      </main>

      {/* Footer Input/Decision */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-30 pb-safe">
        <div className="container mx-auto px-4 py-3 max-w-4xl">
          {isChatActive ? (
            !isTimeUp ? (
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." />
                <Button type="submit" variant="default" size="icon"><Send className="h-4 w-4" /></Button>
              </form>
            ) : (
              <div className="text-center space-y-3">
                {decision ? (
                  <div>
                    <p className="font-semibold">Waiting for {otherUser.name} to decide...</p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold">Time's up! ⏰</h3>
                    <p className="text-muted-foreground">What did you think of the conversation?</p>
                    <div className="flex gap-4 justify-center">
                      <Button variant="outline" onClick={() => handleDecision("pass")}><ThumbsDown className="h-4 w-4 mr-2" />Not for me</Button>
                      <Button variant="default" onClick={() => handleDecision("like")}><Heart className="h-4 w-4 mr-2" />I liked them!</Button>
                    </div>
                  </>
                )}
              </div>
            )
          ) : !showUserLeftMessage && (
              <div className="text-center text-muted-foreground"><p>This chat has ended.</p></div>
          )}
        </div>
      </footer>
      
      {/* Dialogs */}
      <AlertDialog open={showEndChatDialog} onOpenChange={setShowEndChatDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>End Speed Date?</AlertDialogTitle><AlertDialogDescription>This cannot be undone. You will not be matched with this person.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndChat} className="bg-destructive hover:bg-destructive/90">End Chat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <ReportUserDialog open={showReportDialog} onOpenChange={setShowReportDialog} reportedUserId={otherUser?.id || ''} chatId={chatId} onChatEnded={() => navigate('/lobby')} />
      <BlockUserDialog open={showBlockDialog} onOpenChange={setShowBlockDialog} blockedUserId={otherUser?.id || ''} onUserBlocked={() => navigate('/lobby')} />

      {!isMobile && <div className="fixed bottom-0 left-0 right-0 z-20"><Navbar /></div>}
    </div>
  );
};

export default Chat;