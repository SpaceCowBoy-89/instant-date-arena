import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Send, Clock, ThumbsUp, ThumbsDown, ArrowLeft, User, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
  temporary_messages: Message[];
  timer_start_time: string;
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
  const departureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { chatId } = useParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Handle mobile keyboard for iOS and Android
  useEffect(() => {
    const handleViewportChange = () => {
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        const isKeyboardOpen = keyboardHeight > 100;
        
        setKeyboardHeight(isKeyboardOpen ? keyboardHeight : 0);
        
        // Scroll input into view when keyboard opens
        if (isKeyboardOpen) {
          setTimeout(() => {
            const inputElement = document.querySelector('input[placeholder*="message"]') as HTMLElement;
            if (inputElement) {
              inputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 100);
        }
      }
    };

    // Also handle on focus for better Android support
    const handleInputFocus = () => {
      setTimeout(() => {
        const inputElement = document.querySelector('input[placeholder*="message"]') as HTMLElement;
        if (inputElement) {
          inputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
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

  // Load chat data and user profiles
  useEffect(() => {
    if (!chatId) return;
    loadChatData();
    getCurrentUser();
  }, [chatId]);

  // Set up real-time subscription for chat updates, presence tracking, and user interactions
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
          console.log('🔄 Real-time chat update received:', {
            chatId,
            event: payload.eventType,
            new: payload.new,
            tempMessages: payload.new?.temporary_messages,
            permMessages: payload.new?.messages
          });
          
          // Use temporary_messages during speed dating, permanent messages for matches
          if (payload.new) {
            const tempMessages = Array.isArray(payload.new.temporary_messages) 
              ? (payload.new.temporary_messages as unknown as Message[]) 
              : [];
            const permMessages = Array.isArray(payload.new.messages) 
              ? (payload.new.messages as unknown as Message[]) 
              : [];
            
            console.log('📝 Updating messages:', {
              tempCount: tempMessages.length,
              permCount: permMessages.length,
              willShow: tempMessages.length > 0 ? 'temporary' : 'permanent'
            });
            
            // Show temporary messages during speed dating, permanent messages for matches
            const messagesToShow = tempMessages.length > 0 ? tempMessages : permMessages;
            setMessages(messagesToShow);
            
            // Update chat data to keep it in sync
            setChatData(prev => prev ? {...prev, ...payload.new} as ChatData : null);
          }
          
          // Check if chat was completed (mutual match)
          if (payload.new && payload.new.status === 'completed') {
            console.log('🎉 Chat completed! Navigating to messages...');
            toast({
              title: "It's a Match! 💕",
              description: "Both of you liked each other! Your messages have been saved.",
            });
            navigate(`/messages/${chatId}`);
            return;
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_interactions'
        },
        async (payload) => {
          // Listen for the other user's decision
          if (payload.new && 
              payload.new.user_id !== currentUser.id && 
              payload.new.target_user_id === currentUser.id) {
            
            console.log('🔄 Real-time interaction received:', {
              from: payload.new.user_id,
              to: payload.new.target_user_id,
              type: payload.new.interaction_type,
              myDecision: decision
            });
            
            // Check if we now have a mutual match
            if (decision === 'like' && payload.new.interaction_type === 'like') {
              console.log('✅ DELAYED MUTUAL LIKE detected!');
              // MUTUAL LIKE: Move temporary messages to permanent messages
              const currentTempMessages = Array.isArray(chatData?.temporary_messages) 
                ? chatData.temporary_messages 
                : [];

              const { error: moveMessagesError } = await supabase
                .from('chats')
                .update({ 
                  messages: currentTempMessages as any,
                  temporary_messages: [],
                  status: 'completed',
                  updated_at: new Date().toISOString()
                })
                .eq('chat_id', chatId);

              if (moveMessagesError) {
                console.error('Error moving messages to permanent:', moveMessagesError);
              }
            } else if (payload.new.interaction_type === 'reject') {
              // Other user rejected, clear messages and go to lobby
              const { error: clearMessagesError } = await supabase
                .from('chats')
                .update({ 
                  temporary_messages: [],
                  updated_at: new Date().toISOString()
                })
                .eq('chat_id', chatId);

              if (clearMessagesError) {
                console.error('Error clearing temporary messages:', clearMessagesError);
              }

              toast({
                title: "Not a Match",
                description: "Better luck next time!",
              });
              navigate("/lobby");
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
        // Clear any pending departure timeout when user rejoins
        if (departureTimeoutRef.current) {
          clearTimeout(departureTimeoutRef.current);
          departureTimeoutRef.current = null;
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        const presenceState = channel.presenceState();
        const userCount = Object.keys(presenceState).length;
        
        if (userCount <= 1 && chatStatus === 'active') {
          // Set a 30-second delay before considering this a real departure
          departureTimeoutRef.current = setTimeout(() => {
            handleUserDeparture();
          }, 30000); // 30 seconds
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
      // Clear timeout when component unmounts or chat changes
      if (departureTimeoutRef.current) {
        clearTimeout(departureTimeoutRef.current);
        departureTimeoutRef.current = null;
      }
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

  // Synchronized timer for speed dating based on chat start time
  useEffect(() => {
    if (!chatData?.timer_start_time) return;

    const updateTimer = () => {
      const startTime = new Date(chatData.timer_start_time).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - startTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed); // 3 minutes total

      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsTimeUp(true);
      }
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [chatData?.timer_start_time]);

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
      
      // Use temporary_messages during speed dating, permanent messages for matches
      const tempMessages = Array.isArray(chat.temporary_messages) ? (chat.temporary_messages as unknown as Message[]) : [];
      const permMessages = Array.isArray(chat.messages) ? (chat.messages as unknown as Message[]) : [];
      
      // Show temporary messages during speed dating, permanent messages for matches
      setMessages(tempMessages.length > 0 ? tempMessages : permMessages);

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

    console.log('📤 Sending message:', {
      chatId,
      message: newMessageObj,
      currentMessageCount: messages.length,
      newMessageCount: updatedMessages.length,
      currentUser: currentUser.id
    });

    // Immediately update local state for instant display
    setMessages(updatedMessages);
    setNewMessage("");

    try {
      // Store in temporary_messages during speed dating
      const { error } = await supabase
        .from('chats')
        .update({ 
          temporary_messages: updatedMessages as any,
          updated_at: new Date().toISOString()
        })
        .eq('chat_id', chatId);

      if (error) {
        console.error('❌ Error sending message:', error);
        // Revert the local state if database update fails
        setMessages(messages);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Message sent successfully to database');
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      // Revert the local state if there's an exception
      setMessages(messages);
    }
  };

  const handleDecision = async (choice: "like" | "pass") => {
    console.log('💖 User decision:', choice);
    setDecision(choice);
    
    if (!currentUser || !otherUser || !chatData) return;
    
    try {
      // Store the interaction in the database
      const { error: interactionError } = await supabase
        .from('user_interactions')
        .upsert({
          user_id: currentUser.id,
          target_user_id: otherUser.id,
          interaction_type: choice === "like" ? "like" : "reject"
        }, {
          onConflict: 'user_id,target_user_id'
        });

      if (interactionError) {
        console.error('Error storing interaction:', interactionError);
        return;
      }

      // Check for immediate mutual like if this was a like
      if (choice === "like") {
        const { data: mutualLike, error: mutualError } = await supabase
          .from('user_interactions')
          .select('*')
          .eq('user_id', otherUser.id)
          .eq('target_user_id', currentUser.id)
          .eq('interaction_type', 'like')
          .maybeSingle();

        if (mutualError) {
          console.error('Error checking mutual like:', mutualError);
          return;
        }

        if (mutualLike) {
          console.log('✅ IMMEDIATE MUTUAL LIKE detected!');
          // IMMEDIATE MUTUAL LIKE: Move temporary messages to permanent messages
          const currentTempMessages = Array.isArray(chatData.temporary_messages) 
            ? chatData.temporary_messages 
            : [];

          const { error: moveMessagesError } = await supabase
            .from('chats')
            .update({ 
              messages: currentTempMessages as any,
              temporary_messages: [],
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('chat_id', chatId);

          if (moveMessagesError) {
            console.error('Error moving messages to permanent:', moveMessagesError);
          }
          // Note: Navigation will be handled by real-time listener
        }
        // If no immediate mutual like, wait for the other user's decision via real-time
      } else {
        // REJECT: Clear temporary messages and redirect to lobby
        const { error: clearMessagesError } = await supabase
          .from('chats')
          .update({ 
            temporary_messages: [],
            updated_at: new Date().toISOString()
          })
          .eq('chat_id', chatId);

        if (clearMessagesError) {
          console.error('Error clearing temporary messages:', clearMessagesError);
        }

        toast({
          title: "Not a Match",
          description: "Better luck next time!",
        });
        navigate("/lobby");
      }
    } catch (error) {
      console.error('Error in handleDecision:', error);
      navigate("/lobby");
    }
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
    <div className="relative bg-gradient-to-br from-background via-secondary/50 to-muted h-screen overflow-hidden">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-20 pt-safe">
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
      <div 
        className="flex flex-col"
        style={{ 
          height: '100vh',
          paddingTop: '6rem', // Account for fixed header
          paddingBottom: `${Math.max(keyboardHeight + 80, 100)}px` // Account for fixed input
        }}
      >
        <div className="container mx-auto max-w-4xl h-full px-4">
          <div className="flex flex-col h-full">
            {/* Chat Area */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <Card className="flex-1 flex flex-col overflow-hidden">
                <CardHeader className="border-b flex-shrink-0">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Heart className="h-5 w-5 text-romance fill-romance" />
                    Speed Date Chat
                  </CardTitle>
                </CardHeader>
                
                {/* Sticky Profile Bar */}
                <div className={`sticky top-0 z-10 bg-card border-b flex-shrink-0 ${isMobile ? 'p-2' : 'p-4'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} flex-shrink-0`}>
                      <AvatarImage src={otherUser.photo_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white">
                        <User className={`${isMobile ? 'h-3 w-3' : 'h-5 w-5'}`} />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm lg:text-base'} truncate`}>
                        {otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ''}
                      </h3>
                      {otherUser.bio && !isMobile && (
                        <p className="text-xs lg:text-sm text-muted-foreground truncate mt-1">
                          {otherUser.bio}
                        </p>
                      )}
                      {otherUser.preferences?.interests && otherUser.preferences.interests.length > 0 && (
                        <div className={`flex flex-wrap gap-1 ${isMobile ? 'mt-1' : 'mt-2'}`}>
                          {otherUser.preferences.interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="secondary" className={`${isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
                              {interest}
                            </Badge>
                          ))}
                          {otherUser.preferences.interests.length > 3 && (
                            <Badge variant="secondary" className={`${isMobile ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}>
                              +{otherUser.preferences.interests.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                 {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 p-4">
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
        className="fixed left-0 right-0 bg-background/95 backdrop-blur-sm border-t z-30 pb-safe"
        style={{ 
          bottom: `${keyboardHeight}px`,
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
                onFocus={(e) => {
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }, 300);
                }}
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
      
      {/* Fixed Navbar at Bottom - Hidden on Mobile */}
      {!isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-20">
          <Navbar />
        </div>
      )}
    </div>
  );
};

export default Chat;
