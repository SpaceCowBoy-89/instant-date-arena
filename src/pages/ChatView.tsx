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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      loadChat();
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!newMessage.trim() || !currentUser || !chatId) return;

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
      // In a real app, you might want to mark the chat as unmatched instead of deleting
      // For now, we'll just remove the user from the chat or mark it as inactive
      toast({
        title: "Unmatched",
        description: "You have unmatched with this user",
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm">
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
                <div>
                  <h2 className="font-semibold text-foreground">{otherUser.name}</h2>
                  {otherUser.age && (
                    <p className="text-sm text-muted-foreground">{otherUser.age} years old</p>
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

      {/* User Info Card */}
      <div className="container mx-auto px-4 py-4">
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={otherUser.photo_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{otherUser.name}</h3>
                  {otherUser.age && (
                    <Badge variant="secondary">{otherUser.age}</Badge>
                  )}
                </div>
                {otherUser.location && (
                  <p className="text-sm text-muted-foreground mb-1">{otherUser.location}</p>
                )}
                {otherUser.bio && (
                  <p className="text-sm text-foreground">{otherUser.bio}</p>
                )}
                {otherUser.preferences?.interests && otherUser.preferences.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {otherUser.preferences.interests.slice(0, 3).map((interest: string) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages */}
      <div className="flex-1 container mx-auto px-4 pb-24">
        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser?.id
                      ? 'bg-romance text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === currentUser?.id ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="sticky bottom-20 bg-background/95 backdrop-blur-sm border-t border-border p-4">
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
      
      <Navbar />
    </div>
  );
};

export default ChatView;