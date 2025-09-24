import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IOSSafeDropdown, IOSSafeDropdownItem } from "@/components/ui/ios-safe-dropdown";
import { Heart, Send, ArrowLeft, User, UserMinus, MoreVertical, Flag, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BlockUserDialog } from "@/components/BlockUserDialog";
import { ReportUserDialog } from "@/components/ReportUserDialog";

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

const DEPARTURE_TIMEOUT = 30000;
const SCROLL_SHORT_TIMEOUT = 100;
const SCROLL_LONG_TIMEOUT = 300;

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
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportDialogData, setReportDialogData] = useState({
    messageId: '',
    messageContent: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const departureTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const redirectToMessages = () => navigate("/messages");

  const showErrorToast = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const logError = (context: string, error: any) => {
    console.error(`${context}:`, error);
  };

  const canPerformChatAction = (requiresMessage: boolean = false) => {
    if (!chatId || !currentUser || chatStatus !== 'active') return false;
    if (requiresMessage && !newMessage.trim()) return false;
    return true;
  };

  const scrollToInput = (timeout: number = SCROLL_SHORT_TIMEOUT) => {
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder*="message"]') as HTMLElement;
      if (inputElement) {
        inputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, timeout);
  };

  useEffect(() => {
    if (chatId) {
      loadChat();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        const isKeyboardOpen = keyboardHeight > 100;
        
        setKeyboardHeight(isKeyboardOpen ? keyboardHeight : 0);
        
        if (isKeyboardOpen) {
          scrollToInput(SCROLL_SHORT_TIMEOUT);
        }
      }
    };

    const handleInputFocus = () => {
      scrollToInput(SCROLL_LONG_TIMEOUT);
    };

    const inputElement = document.querySelector('input[placeholder*="message"]');
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
    
    if (inputElement) {
      inputElement.addEventListener('focus', handleInputFocus);
    }
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      if (inputElement) {
        inputElement.removeEventListener('focus', handleInputFocus);
      }
    };
  }, []);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    console.log('Setting up real-time subscription for chat:', chatId);
    
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('Real-time chat update received:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            if (payload.new && payload.new.messages) {
              const updatedMessages = Array.isArray(payload.new.messages) 
                ? (payload.new.messages as unknown as Message[]) 
                : [];
              
              console.log('Updating messages from real-time:', updatedMessages.length, 'messages');
              
              setMessages([...updatedMessages]);
              
              setTimeout(() => {
                scrollToBottom();
              }, 100);
            }
            
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
        if (departureTimeoutRef.current) {
          clearTimeout(departureTimeoutRef.current);
          departureTimeoutRef.current = null;
        }
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
          departureTimeoutRef.current = setTimeout(() => {
            handleUserDeparture();
          }, DEPARTURE_TIMEOUT);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            user_name: currentUser.user_metadata?.name || 'Anonymous',
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      if (departureTimeoutRef.current) {
        clearTimeout(departureTimeoutRef.current);
        departureTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, chatStatus, otherUser, showUserLeftMessage]);

  const handleUserDeparture = async () => {
    if (!canPerformChatAction()) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          status: 'ended_by_departure',
          ended_at: new Date().toISOString(),
          ended_by: currentUser.id
        })
        .eq('chat_id', chatId);

      if (error) {
        logError('Error updating chat status', error);
        return;
      }

      setChatStatus('ended_by_departure');
      setOtherUserPresent(false);
      setShowUserLeftMessage(true);
    } catch (error) {
      logError('Error in handleUserDeparture', error);
    }
  };

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

      const { data: chat, error } = await supabase
        .from('chats')
        .select('*')
        .eq('chat_id', chatId)
        .single();

      if (error || !chat) {
        logError('Error loading chat', error);
        showErrorToast("Error", "Chat not found");
        redirectToMessages();
        return;
      }

      if (chat.user1_id !== user.id && chat.user2_id !== user.id) {
        showErrorToast("Access Denied", "You don't have access to this chat");
        redirectToMessages();
        return;
      }

      const otherUserId = chat.user1_id === user.id ? chat.user2_id : chat.user1_id;
      const { data: otherUserData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', otherUserId)
        .single();

      if (userError || !otherUserData) {
        logError('Error loading other user', userError);
        showErrorToast("Error", "Failed to load user information");
        redirectToMessages();
        return;
      }

      setOtherUser(otherUserData as OtherUser);
      setMessages((chat.messages as unknown as Message[]) || []);
      setLoading(false);
    } catch (error) {
      logError('Error in loadChat', error);
      showErrorToast("Error", "Failed to load chat");
      redirectToMessages();
    }
  };

  const sendMessage = async () => {
    if (!canPerformChatAction(true)) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender_id: currentUser.id,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    try {
      const { error } = await supabase
        .from('chats')
        .update({ messages: [...messages, { ...message, id: Date.now().toString() }] as any })
        .eq('chat_id', chatId);

      if (error) {
        logError('Error sending message', error);
        showErrorToast("Error", "Failed to send message");
        setMessages(messages); // Revert on failure
      }
    } catch (error) {
      logError('Error in sendMessage', error);
      showErrorToast("Error", "Failed to send message");
        if (Array.isArray(messages)) {
          setMessages(messages);
        } else {
          setMessages([]);
        }
    }
  };

  const handleUnmatch = async () => {
    if (!chatId) return;

    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('chat_id', chatId);

      if (error) {
        logError('Error deleting chat', error);
        showErrorToast("Error", "Failed to unmatch. Please try again.");
        return;
      }

      toast({
        title: "Unmatched",
        description: "You have unmatched with this user. The conversation has been deleted.",
      });
      redirectToMessages();
    } catch (error) {
      logError('Error unmatching', error);
      showErrorToast("Error", "Failed to unmatch");
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
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: `calc(env(safe-area-inset-bottom) + 1px)`
      }}
    >
      {/* Fixed Header */}
      <div 
        className="fixed left-0 right-0 border-b border-border bg-background/95 backdrop-blur-sm z-20"
        style={{ top: 'env(safe-area-inset-top)' }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => redirectToMessages()}
                className="h-10 w-10"
                aria-label="Back to messages"
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
            
            <IOSSafeDropdown
              title="Chat Options"
              trigger={
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              }
            >
              <IOSSafeDropdownItem
                onClick={() => {
                  setReportDialogData({ messageId: '', messageContent: '' });
                  setShowReportDialog(true);
                }}
                className="text-orange-600 focus:text-orange-600"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </IOSSafeDropdownItem>
              <IOSSafeDropdownItem
                onClick={() => setShowBlockDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Shield className="h-4 w-4 mr-2" />
                Block User
              </IOSSafeDropdownItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <IOSSafeDropdownItem
                    onClick={(e) => e.preventDefault()}
                    destructive
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Unmatch
                  </IOSSafeDropdownItem>
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
            </IOSSafeDropdown>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="content-with-fixed-header px-4"
        style={{ 
          height: `calc(100vh - env(safe-area-inset-top) - 1px - env(safe-area-inset-bottom) - 1px)`,
          marginBottom: '1px'
        }}
      >
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <div className="space-y-4 pr-4" style={{ paddingTop: '24px', paddingBottom: '8px', minHeight: 'calc(100% - 32px)' }}>
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
                  className={`max-w-[280px] lg:max-w-sm px-4 py-2 rounded-lg border group relative ${
                    message.sender_id === currentUser?.id
                      ? 'bg-romance text-white border-romance/20 shadow-sm'
                      : 'bg-card text-foreground border-border shadow-sm hover:border-border/60 transition-colors cursor-pointer'
                  }`}
                  onClick={() => {
                    if (message.sender_id !== currentUser?.id) {
                      setReportDialogData({
                        messageId: message.id,
                        messageContent: message.text
                      });
                      setShowReportDialog(true);
                    }
                  }}
                >
                  <p className="text-sm break-words">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === currentUser?.id ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                  {message.sender_id !== currentUser?.id && (
                    <div className="opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity">
                      <Flag className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} style={{ height: '8px', flexShrink: 0 }} />
          </div>
        </div>
      </div>

      {/* Fixed Input at Bottom */}
      <div 
        className="fixed left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-35"
        style={{ 
          bottom: `env(safe-area-inset-bottom)`, // Adjusted to account for no navbar
          height: '60px',
          paddingRight: '80px' // Add padding to avoid overlap with floating button
        }}
      >
        <div className="px-4 py-3">
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
              onFocus={(e) => {
                scrollToInput(SCROLL_LONG_TIMEOUT);
              }}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              size="icon"
              variant="romance"
              style={{ zIndex: 40 }} // Ensure send button stays above floating button
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Report and Block Dialogs */}
      <ReportUserDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={otherUser.id}
        reportedUserName={otherUser.name}
        chatId={chatId}
        messageId={reportDialogData.messageId || undefined}
        messageContent={reportDialogData.messageContent || undefined}
        onChatEnded={redirectToMessages}
      />

      <BlockUserDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        blockedUserId={otherUser.id}
        blockedUserName={otherUser.name}
        chatId={chatId}
        onChatEnded={redirectToMessages}
        onUserBlocked={() => {
          toast({
            title: "User Blocked",
            description: `${otherUser.name} has been blocked successfully.`,
          });
        }}
      />
    </div>
  );
};

export default ChatView;