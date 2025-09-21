import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Send, Paperclip, Image, Video, Flag, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { motion } from "framer-motion";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "./GroupChat.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
} from "@chatscope/chat-ui-kit-react";

interface ChatMessage {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  user?: {
    name: string;
    photo_url?: string;
  };
}

interface Community {
  id: string;
  tag_name: string;
  tag_subtitle: string;
}

const GroupChat = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Community theme system
  const getCommunityTheme = (groupName: string) => {
    const themes: Record<string, {
      primary: string;
      primaryDark: string;
      secondary: string;
      background: string;
      text: string;
      accent: string;
      gradient: string;
    }> = {
      "Book Lovers": {
        primary: "#f59e0b", // amber-500
        primaryDark: "#d97706", // amber-600
        secondary: "#fef3c7", // amber-100
        background: "from-amber-50 to-amber-100",
        text: "text-amber-900",
        accent: "amber",
        gradient: "from-amber-400 to-amber-600"
      },
      "Movie Aficionados": {
        primary: "#a855f7", // purple-500
        primaryDark: "#9333ea", // purple-600
        secondary: "#f3e8ff", // purple-100
        background: "from-purple-50 to-purple-100",
        text: "text-purple-900",
        accent: "purple",
        gradient: "from-purple-400 to-purple-600"
      },
      "Foodies": {
        primary: "#f97316", // orange-500
        primaryDark: "#ea580c", // orange-600
        secondary: "#fed7aa", // orange-100
        background: "from-orange-50 to-orange-100",
        text: "text-orange-900",
        accent: "orange",
        gradient: "from-orange-400 to-orange-600"
      },
      "Gamers": {
        primary: "#3b82f6", // blue-500
        primaryDark: "#2563eb", // blue-600
        secondary: "#dbeafe", // blue-100
        background: "from-blue-50 to-blue-100",
        text: "text-blue-900",
        accent: "blue",
        gradient: "from-blue-400 to-blue-600"
      },
      "Anime Addicts": {
        primary: "#ec4899", // pink-500
        primaryDark: "#db2777", // pink-600
        secondary: "#fce7f3", // pink-100
        background: "from-pink-50 to-pink-100",
        text: "text-pink-900",
        accent: "pink",
        gradient: "from-pink-400 to-pink-600"
      },
      "Creators": {
        primary: "#22c55e", // green-500
        primaryDark: "#16a34a", // green-600
        secondary: "#dcfce7", // green-100
        background: "from-green-50 to-green-100",
        text: "text-green-900",
        accent: "green",
        gradient: "from-green-400 to-green-600"
      },
      "Adventurers": {
        primary: "#10b981", // emerald-500
        primaryDark: "#059669", // emerald-600
        secondary: "#d1fae5", // emerald-100
        background: "from-emerald-50 to-emerald-100",
        text: "text-emerald-900",
        accent: "emerald",
        gradient: "from-emerald-400 to-emerald-600"
      },
      "Sports Enthusiasts": {
        primary: "#ef4444", // red-500
        primaryDark: "#dc2626", // red-600
        secondary: "#fee2e2", // red-100
        background: "from-red-50 to-red-100",
        text: "text-red-900",
        accent: "red",
        gradient: "from-red-400 to-red-600"
      },
      "Collectors": {
        primary: "#6366f1", // indigo-500
        primaryDark: "#4f46e5", // indigo-600
        secondary: "#e0e7ff", // indigo-100
        background: "from-indigo-50 to-indigo-100",
        text: "text-indigo-900",
        accent: "indigo",
        gradient: "from-indigo-400 to-indigo-600"
      },
      "Tech Hobbyists": {
        primary: "#06b6d4", // cyan-500
        primaryDark: "#0891b2", // cyan-600
        secondary: "#cffafe", // cyan-100
        background: "from-cyan-50 to-cyan-100",
        text: "text-cyan-900",
        accent: "cyan",
        gradient: "from-cyan-400 to-cyan-600"
      },
      "Music & Performance": {
        primary: "#8b5cf6", // violet-500
        primaryDark: "#7c3aed", // violet-600
        secondary: "#ede9fe", // violet-100
        background: "from-violet-50 to-violet-100",
        text: "text-violet-900",
        accent: "violet",
        gradient: "from-violet-400 to-violet-600"
      },
      "Nature Lovers": {
        primary: "#84cc16", // lime-500
        primaryDark: "#65a30d", // lime-600
        secondary: "#ecfccb", // lime-100
        background: "from-lime-50 to-lime-100",
        text: "text-lime-900",
        accent: "lime",
        gradient: "from-lime-400 to-lime-600"
      },
      "Social & Cultural": {
        primary: "#f43f5e", // rose-500
        primaryDark: "#e11d48", // rose-600
        secondary: "#ffe4e6", // rose-100
        background: "from-rose-50 to-rose-100",
        text: "text-rose-900",
        accent: "rose",
        gradient: "from-rose-400 to-rose-600"
      }
    };

    return themes[groupName] || {
      primary: "#dc2868", // romance fallback
      primaryDark: "#b91c5c",
      secondary: "#fce7f3",
      background: "from-romance/10 to-purple-accent/10",
      text: "text-romance",
      accent: "romance",
      gradient: "from-romance to-purple-accent"
    };
  };

  const currentTheme = community ? getCommunityTheme(community.tag_name) : null;

  // Check if user is authenticated and is member of the community
  useEffect(() => {
    checkUserAndMembership();
  }, [communityId]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (user && communityId && isMember) {
      fetchMessages();
      // Disable real-time subscription for mock data testing
      // subscribeToMessages();
    }
  }, [user, communityId, isMember]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close file options and message options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFileOptions) {
        setShowFileOptions(false);
      }
      if (showMessageOptions) {
        setShowMessageOptions(null);
      }
    };

    if (showFileOptions || showMessageOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFileOptions, showMessageOptions]);

  const checkUserAndMembership = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/');
        return;
      }
      setUser(authUser);

      // Fetch community info
      const { data: communityData } = await supabase
        .from('connections_groups')
        .select('id, tag_name, tag_subtitle')
        .eq('id', communityId)
        .single();

      if (communityData) {
        setCommunity(communityData);
      }

      // Check if user is a member
      const { data: membershipData } = await supabase
        .from('user_connections_groups')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('group_id', communityId)
        .single();

      if (membershipData) {
        setIsMember(true);
      } else {
        toast({
          title: "Access Denied",
          description: "You must be a member of this community to access the chat.",
          variant: "destructive",
        });
        navigate(`/communities/${communityId}`);
      }
    } catch (error) {
      console.error('Error checking user and membership:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      // Mock data for testing - replace with real database call later
      const mockMessages = [
        {
          id: '1',
          message: 'Welcome to the SpeedHeart community chat! 🎉',
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          user_id: 'system',
          user: {
            name: 'Community Bot',
            photo_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=bot&backgroundColor=f1c2c9'
          }
        },
        {
          id: '2',
          message: 'Hey everyone! Excited to be part of this amazing community 😊',
          created_at: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
          user_id: 'user1',
          user: {
            name: 'Sarah Martinez',
            photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=f1c2c9'
          }
        },
        {
          id: '3',
          message: 'Just joined! Looking forward to connecting with fellow speed dating enthusiasts',
          created_at: new Date(Date.now() - 900000).toISOString(), // 15 min ago
          user_id: 'user2',
          user: {
            name: 'Alex Kim',
            photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=e6f3ff'
          }
        },
        {
          id: '4',
          message: 'Has anyone tried the Speed Pulse arena yet? It looks super fun! ⚡',
          created_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
          user_id: 'user3',
          user: {
            name: 'Jamie Lopez',
            photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie&backgroundColor=fff2e6'
          }
        },
        {
          id: '5',
          message: 'Yes! I love the quick-fire format. Great way to meet people 💕',
          created_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
          user_id: 'user1',
          user: {
            name: 'Sarah Martinez',
            photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=f1c2c9'
          }
        }
      ];

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: `Failed to load chat messages: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('community-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          // For now, add messages without user data lookup to test basic functionality
          const newMessage: ChatMessage = {
            id: payload.new.id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            media_url: payload.new.media_url,
            media_type: payload.new.media_type,
            user: { name: payload.new.user_id === user?.id ? 'You' : 'Anonymous User' },
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (innerHtml: string, textContent: string) => {
    if (!textContent.trim() || !user || !communityId) return;

    try {
      // Mock message sending - replace with real database call later
      const newMessage = {
        id: `mock-${Date.now()}`,
        message: textContent.trim(),
        created_at: new Date().toISOString(),
        user_id: user.id,
        user: {
          name: 'You',
          photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}&backgroundColor=d4f4dd`
        }
      };

      // Add message immediately for instant feedback
      setMessages(prev => [...prev, newMessage]);

      // Simulate typing indicator and response
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);

        // Add a mock response from another user
        const responses = [
          "That's awesome! 🎉",
          "Great point! I totally agree 👍",
          "Thanks for sharing that! 😊",
          "Interesting perspective! 🤔",
          "Love the energy in this chat! ⚡"
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseMessage = {
          id: `response-${Date.now()}`,
          message: randomResponse,
          created_at: new Date().toISOString(),
          user_id: 'mock-user',
          user: {
            name: 'Community Member',
            photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=community&backgroundColor=e6f3ff'
          }
        };

        setMessages(prev => [...prev, responseMessage]);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (!user || !communityId) return;

    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to upload media.',
          variant: 'destructive',
        });
        return;
      }

      // Upload to Supabase Storage using the same approach as PostCreation
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`https://rbxnndsqgscxamvlxloh.supabase.co/functions/v1/upload-post-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      const newMessage: ChatMessage = {
        id: `media-${Date.now()}`,
        message: type === 'image' ? '📷 Image' : '🎥 Video',
        created_at: new Date().toISOString(),
        user_id: user.id,
        media_url: result.url,
        media_type: type,
        user: {
          name: 'You',
          photo_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}&backgroundColor=d4f4dd`
        }
      };

      // Add message immediately for instant feedback
      setMessages(prev => [...prev, newMessage]);

      toast({
        title: "Media Uploaded",
        description: `${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`,
      });

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
    setShowFileOptions(false);
  };

  const handleVideoUpload = () => {
    videoInputRef.current?.click();
    setShowFileOptions(false);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
    // Reset the input
    event.target.value = '';
  };

  const reportMessage = async (messageId: string) => {
    try {
      // Mock reporting functionality - in real implementation would send to moderation system
      toast({
        title: "Message Reported",
        description: "Thank you for helping keep our community safe. The message has been reported for review.",
      });
      setShowMessageOptions(null);
    } catch (error) {
      console.error('Error reporting message:', error);
      toast({
        title: "Report Error",
        description: "Failed to report message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMessageContextMenu = (messageId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const message = messages.find(m => m.id === messageId);
    if (message && message.user_id !== user?.id) {
      setShowMessageOptions(showMessageOptions === messageId ? null : messageId);
    }
  };

  const formatMessage = (msg: ChatMessage) => {
    const isCurrentUser = msg.user_id === user?.id;

    // Create media content if this is a media message
    let messageContent = msg.message;
    if (msg.media_url && msg.media_type) {
      if (msg.media_type === 'image') {
        messageContent = `<div style="max-width: 300px; border-radius: 12px; overflow: hidden; margin: 4px 0;">
          <img src="${msg.media_url}" alt="Shared image" style="width: 100%; height: auto; display: block;" />
        </div>`;
      } else if (msg.media_type === 'video') {
        messageContent = `<div style="max-width: 300px; border-radius: 12px; overflow: hidden; margin: 4px 0;">
          <video controls style="width: 100%; height: auto; display: block;">
            <source src="${msg.media_url}" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>`;
      }
    }

    const avatarUrl = msg.user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.user?.name || 'default'}&backgroundColor=f1c2c9`;
    const senderName = isCurrentUser ? "You" : (msg.user?.name || "Anonymous");

    return {
      message: messageContent,
      sentTime: new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }),
      sender: senderName,
      direction: isCurrentUser ? "outgoing" as const : "incoming" as const,
      position: "single" as const,
      avatar: avatarUrl,
      avatarSpacer: false
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: currentTheme
        ? `linear-gradient(135deg, ${currentTheme.secondary}, ${currentTheme.secondary})`
        : 'hsl(var(--background))'
    }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 border-b sticky top-0 z-50"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          background: currentTheme
            ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primaryDark})`
            : 'rgba(0, 0, 0, 0.9)',
          borderColor: currentTheme?.primary + '30' || 'hsl(var(--border))'
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/communities/${communityId}`)}
          className="h-10 w-10 shrink-0 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate text-white">
            {community?.tag_name} Chat
          </h1>
          <p className="text-sm text-white/80">
            {onlineUsers > 0 ? `${onlineUsers} members online` : "Group chat"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Users className="h-4 w-4" />
            <span>{messages.length} messages</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMessageOptions('report-general')}
            className="h-8 w-8 p-0 text-white hover:bg-white/10"
            title="Report inappropriate content"
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col pb-16">
        {isMember ? (
          <div
            className="flex-1 speedheart-chat"
            style={{
              '--theme-primary': currentTheme?.primary || 'hsl(var(--romance))',
              '--theme-primary-dark': currentTheme?.primaryDark || 'hsl(var(--romance-dark))',
              '--theme-secondary': currentTheme?.secondary || 'hsl(var(--romance))/10',
              '--theme-gradient-from': currentTheme?.primary || 'hsl(var(--romance))',
              '--theme-gradient-to': currentTheme?.primaryDark || 'hsl(var(--purple-accent))',
              height: 'calc(100vh - 144px)', // Account for header + safe areas
            } as React.CSSProperties}
          >
            <MainContainer>
              <ChatContainer>
                <MessageList
                  scrollBehavior="smooth"
                  typingIndicator={isTyping ? <TypingIndicator content="Someone is typing..." /> : null}
                >
                  {messages.map((message) => (
                    <Message key={message.id} model={formatMessage(message)} />
                  ))}
                </MessageList>
                
                {/* Inline File Upload Section */}
                <div className="border-t border-border/20 bg-background/95 backdrop-blur-sm">
                  {showFileOptions && (
                    <div className="p-3 border-b border-border/10">
                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => onFileChange(e, 'image')}
                          className="hidden"
                          id="image-upload"
                        />
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          onChange={(e) => onFileChange(e, 'video')}
                          className="hidden"
                          id="video-upload"
                        />
                        <label htmlFor="image-upload">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer flex items-center gap-2"
                            asChild
                          >
                            <span>
                              <Image className="h-4 w-4" />
                              Image
                            </span>
                          </Button>
                        </label>
                        <label htmlFor="video-upload">
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer flex items-center gap-2"
                            asChild
                          >
                            <span>
                              <Video className="h-4 w-4" />
                              Video
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  )}
                  
                  <MessageInput
                    placeholder="Type your message..."
                    onSend={sendMessage}
                    attachButton={true}
                    onAttachClick={() => setShowFileOptions(!showFileOptions)}
                  />
                </div>
              </ChatContainer>
            </MainContainer>

            {/* Report Options Modal */}
            {showMessageOptions && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowMessageOptions(null)}
              >
                <div
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-4">Report Content</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Help us maintain a safe community by reporting inappropriate content, harassment, or rule violations.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => reportMessage('general')}
                      className="flex-1 text-white"
                      style={{
                        background: currentTheme
                          ? `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.primaryDark})`
                          : 'linear-gradient(to right, hsl(var(--romance)), hsl(var(--purple-accent)))'
                      }}
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </Button>
                    <Button
                      onClick={() => setShowMessageOptions(null)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2 text-foreground">Access Denied</h2>
              <p className="text-muted-foreground mb-6">
                You must be a member of this community to access the group chat.
              </p>
              <Button
                onClick={() => navigate(`/communities/${communityId}`)}
                className="text-white"
                style={{
                  background: currentTheme
                    ? `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.primaryDark})`
                    : 'linear-gradient(to right, hsl(var(--romance)), hsl(var(--purple-accent)))'
                }}
              >
                Back to Community
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChat;