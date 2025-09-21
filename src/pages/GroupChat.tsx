import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Users, Send, Image, Video, Flag, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  message: string; // Short chat message text (NOT long-form posts)
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
  const messageInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<any>(null);
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [showFileOptions, setShowFileOptions] = useState(false);
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const [realtimeCleanup, setRealtimeCleanup] = useState<(() => void) | null>(null);
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
        primary: "#f59e0b",
        primaryDark: "#d97706",
        secondary: "#fef3c7",
        background: "from-amber-50 to-amber-100",
        text: "text-amber-900",
        accent: "amber",
        gradient: "from-amber-400 to-amber-600"
      },
      "Movie Aficionados": {
        primary: "#a855f7",
        primaryDark: "#9333ea",
        secondary: "#f3e8ff",
        background: "from-purple-50 to-purple-100",
        text: "text-purple-900",
        accent: "purple",
        gradient: "from-purple-400 to-purple-600"
      },
      "Foodies": {
        primary: "#f97316",
        primaryDark: "#ea580c",
        secondary: "#fed7aa",
        background: "from-orange-50 to-orange-100",
        text: "text-orange-900",
        accent: "orange",
        gradient: "from-orange-400 to-orange-600"
      },
      "Gamers": {
        primary: "#3b82f6",
        primaryDark: "#2563eb",
        secondary: "#dbeafe",
        background: "from-blue-50 to-blue-100",
        text: "text-blue-900",
        accent: "blue",
        gradient: "from-blue-400 to-blue-600"
      },
      "Anime Addicts": {
        primary: "#ec4899",
        primaryDark: "#db2777",
        secondary: "#fce7f3",
        background: "from-pink-50 to-pink-100",
        text: "text-pink-900",
        accent: "pink",
        gradient: "from-pink-400 to-pink-600"
      },
      "Creators": {
        primary: "#22c55e",
        primaryDark: "#16a34a",
        secondary: "#dcfce7",
        background: "from-green-50 to-green-100",
        text: "text-green-900",
        accent: "green",
        gradient: "from-green-400 to-green-600"
      },
      "Adventurers": {
        primary: "#10b981",
        primaryDark: "#059669",
        secondary: "#d1fae5",
        background: "from-emerald-50 to-emerald-100",
        text: "text-emerald-900",
        accent: "emerald",
        gradient: "from-emerald-400 to-emerald-600"
      },
      "Sports Enthusiasts": {
        primary: "#ef4444",
        primaryDark: "#dc2626",
        secondary: "#fee2e2",
        background: "from-red-50 to-red-100",
        text: "text-red-900",
        accent: "red",
        gradient: "from-red-400 to-red-600"
      },
      "Collectors": {
        primary: "#6366f1",
        primaryDark: "#4f46e5",
        secondary: "#e0e7ff",
        background: "from-indigo-50 to-indigo-100",
        text: "text-indigo-900",
        accent: "indigo",
        gradient: "from-indigo-400 to-indigo-600"
      },
      "Tech Hobbyists": {
        primary: "#06b6d4",
        primaryDark: "#0891b2",
        secondary: "#cffafe",
        background: "from-cyan-50 to-cyan-100",
        text: "text-cyan-900",
        accent: "cyan",
        gradient: "from-cyan-400 to-cyan-600"
      },
      "Music & Performance": {
        primary: "#8b5cf6",
        primaryDark: "#7c3aed",
        secondary: "#ede9fe",
        background: "from-violet-50 to-violet-100",
        text: "text-violet-900",
        accent: "violet",
        gradient: "from-violet-400 to-violet-600"
      },
      "Nature Lovers": {
        primary: "#84cc16",
        primaryDark: "#65a30d",
        secondary: "#ecfccb",
        background: "from-lime-50 to-lime-100",
        text: "text-lime-900",
        accent: "lime",
        gradient: "from-lime-400 to-lime-600"
      },
      "Social & Cultural": {
        primary: "#f43f5e",
        primaryDark: "#e11d48",
        secondary: "#ffe4e6",
        background: "from-rose-50 to-rose-100",
        text: "text-rose-900",
        accent: "rose",
        gradient: "from-rose-400 to-rose-600"
      }
    };

    return themes[groupName] || {
      primary: "#dc2868",
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

  // Set up real-time subscription for messages and presence
  useEffect(() => {
    if (user && communityId && isMember) {
      fetchMessages();
      setupPresenceTracking();
    }

    return () => {
      if (realtimeCleanup) {
        realtimeCleanup();
      }
    };
  }, [user, communityId, isMember]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close file options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFileOptions || showMessageOptions) {
        setShowFileOptions(false);
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
      // Fetch ONLY chat messages from the database (NOT posts)
      // Posts are handled separately in CommunityDetail.tsx
      const { data: messagesData, error } = await supabase
        .from('connections_group_messages')
        .select('id, message, created_at, user_id, media_url, media_type')
        .eq('group_id', communityId)
        .order('created_at', { ascending: true })
        .limit(100); // Limit for performance

      if (error) {
        throw error;
      }

      if (!messagesData?.length) {
        setMessages([]);
        setupRealtimeSubscription();
        return;
      }

      // Validate that we only have chat messages (additional safety check)
      const validMessages = messagesData.filter(msg => 
        msg.message && 
        msg.user_id && 
        msg.created_at &&
        typeof msg.message === 'string' &&
        msg.message.length <= 2000 // Chat messages shouldn't be extremely long like posts
      );

      // Get unique user IDs
      const userIds = [...new Set(validMessages.map(msg => msg.user_id))];

      // Fetch user data for all message senders
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, photo_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Create user lookup map
      const userMap = new Map();
      usersData?.forEach(user => {
        userMap.set(user.id, user);
      });

      // Transform the data to match our interface
      const transformedMessages: ChatMessage[] = validMessages.map(msg => {
        const userData = userMap.get(msg.user_id);
        return {
          id: msg.id,
          message: msg.message,
          created_at: msg.created_at,
          user_id: msg.user_id,
          media_url: msg.media_url,
          media_type: msg.media_type as 'image' | 'video' | undefined,
          user: {
            name: userData?.name || 'Anonymous',
            photo_url: userData?.photo_url
          }
        };
      });

      setMessages(transformedMessages);
      setupRealtimeSubscription();

    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    }
  };

  const setupRealtimeSubscription = () => {
    // Clean up any existing subscription
    if (realtimeCleanup) {
      realtimeCleanup();
    }

    // Set up real-time subscription for new CHAT MESSAGES only (NOT posts)
    const channel = supabase
      .channel(`group_messages:${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections_group_messages', // ONLY chat messages table
          filter: `group_id=eq.${communityId}`
        },
        async (payload) => {
          // Validate that this is a chat message and not accidentally a post
          if (!payload.new.message || !payload.new.user_id) {
            return;
          }

          // Fetch the user data for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('name, photo_url')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: ChatMessage = {
            id: payload.new.id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            media_url: payload.new.media_url,
            media_type: payload.new.media_type as 'image' | 'video' | undefined,
            user: userData ? {
              name: userData.name,
              photo_url: userData.photo_url
            } : {
              name: 'Anonymous',
              photo_url: undefined
            }
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(channel);
    };

    setRealtimeCleanup(() => cleanup);
  };

  const setupPresenceTracking = () => {
    if (!user || !communityId) return;

    // Create a presence channel for this group chat
    const presenceChannel = supabase.channel(`group_presence:${communityId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    // Track user presence
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = presenceChannel.presenceState();
        const userCount = Object.keys(presenceState).length;
        setOnlineUsers(userCount);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // User joined chat
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // User left chat
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user as present in the chat
          const presenceTrackStatus = await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          
          if (presenceTrackStatus !== 'ok') {
            // Failed to track presence, but continue
          }
        }
      });

    // Update cleanup to include presence channel
    const originalCleanup = realtimeCleanup;
    setRealtimeCleanup(() => () => {
      if (originalCleanup) originalCleanup();
      supabase.removeChannel(presenceChannel);
    });
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !user || !communityId) return;

    const messageText = messageInput.trim();
    
    // Validate message is appropriate for chat (not a long-form post)
    if (messageText.length > 2000) {
      toast({
        title: "Message too long",
        description: "Chat messages should be under 2000 characters. Use the community feed for longer posts.",
        variant: "destructive",
      });
      return;
    }

    setMessageInput('');

    try {
      // Insert CHAT MESSAGE into the messages table (NOT the posts table)
      const { data: insertedMessage, error } = await supabase
        .from('connections_group_messages') // Explicitly using chat messages table
        .insert([
          {
            group_id: communityId,
            user_id: user.id,
            message: messageText
          }
        ])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Send notification to other group members
      try {
        await supabase.functions.invoke('send-group-message-notification', {
          body: {
            messageId: insertedMessage.id,
            groupId: communityId,
            senderId: user.id,
            message: messageText
          }
        });
      } catch (notificationError) {
        console.error('Error sending group message notification:', notificationError);
        // Don't fail the message sending if notification fails
      }

      // Message will be added to UI via real-time subscription
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message input if sending failed
      setMessageInput(messageText);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    console.log('handleFileUpload called:', { fileName: file.name, fileType: type, user: !!user, communityId });
    if (!user || !communityId) return;

    // Check file size (20MB limit)
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `${type === 'image' ? 'Image' : 'Video'} must be under 20MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication required',
          description: 'Please log in to upload media.',
          variant: 'destructive',
        });
        return;
      }

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

      // Save media message to database
      const { data: insertedMessage, error } = await supabase
        .from('connections_group_messages')
        .insert([
          {
            group_id: communityId,
            user_id: user.id,
            message: type === 'image' ? '📷 Image' : '🎥 Video',
            media_url: result.url,
            media_type: type
          }
        ])
        .select('id')
        .single();

      if (error) {
        throw error;
      }

      // Send notification to other group members
      try {
        await supabase.functions.invoke('send-group-message-notification', {
          body: {
            messageId: insertedMessage.id,
            groupId: communityId,
            senderId: user.id,
            message: type === 'image' ? '📷 Image' : '🎥 Video'
          }
        });
      } catch (notificationError) {
        // Don't fail the media upload if notification fails
      }

      toast({
        title: "Media Uploaded",
        description: `${type === 'image' ? 'Image' : 'Video'} uploaded successfully!`,
      });

    } catch (error) {
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
    console.log('Video upload button clicked');
    videoInputRef.current?.click();
    setShowFileOptions(false);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    console.log('onFileChange triggered:', { type, files: event.target.files });
    const file = event.target.files?.[0];
    if (file) {
      console.log('File selected:', { name: file.name, size: file.size, type: file.type });
      handleFileUpload(file, type);
    }
    event.target.value = '';
  };

  const reportMessage = async (messageId: string) => {
    try {
      if (!user) return;

      // Submit report to database
      const { error } = await supabase
        .from('user_reports')
        .insert([
          {
            reporter_id: user.id,
            reported_user_id: messages.find(m => m.id === messageId)?.user_id,
            message_id: messageId,
            report_type: 'inappropriate_content',
            description: 'Inappropriate message content reported from group chat'
          }
        ]);

      if (error) {
        throw error;
      }

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div
        className="flex items-center gap-4 p-4 border-b sticky top-0 z-50 backdrop-blur-sm"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          background: currentTheme
            ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primaryDark})`
            : 'hsl(var(--primary))',
          borderColor: 'hsl(var(--border))'
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
            {onlineUsers > 0 ? `${onlineUsers} member${onlineUsers !== 1 ? 's' : ''} online` : "Group chat"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Users className="h-4 w-4" />
            <span>{onlineUsers > 0 ? `${onlineUsers} ${onlineUsers === 1 ? 'user' : 'users'} online` : 'No users online'}</span>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col">
        {isMember ? (
          <>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isCurrentUser = message.user_id === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                    >
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage 
                            src={message.user?.photo_url} 
                            alt={message.user?.name || 'User'} 
                          />
                          <AvatarFallback className="text-xs">
                            {message.user?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
                        {!isCurrentUser && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {message.user?.name || 'Anonymous'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(message.created_at)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`relative group`}>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isCurrentUser
                                ? 'text-white shadow-md'
                                : 'bg-muted text-foreground border'
                            }`}
                            style={isCurrentUser ? {
                              background: currentTheme
                                ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primaryDark})`
                                : 'hsl(var(--primary))'
                            } : {}}
                          >
                            {message.media_url && message.media_type === 'image' && (
                              <img 
                                src={message.media_url} 
                                alt="Shared image" 
                                className="max-w-64 rounded-lg mb-2" 
                              />
                            )}
                            {message.media_url && message.media_type === 'video' && (
                              <video 
                                controls 
                                className="max-w-64 rounded-lg mb-2"
                              >
                                <source src={message.media_url} type="video/mp4" />
                              </video>
                            )}
                            <p className="text-sm break-words">{message.message}</p>
                          </div>
                          
                          {/* Message Options */}
                          {!isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute -right-8 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => setShowMessageOptions(showMessageOptions === message.id ? null : message.id)}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {showMessageOptions === message.id && (
                            <div className="absolute right-0 top-8 bg-background border rounded-lg shadow-lg p-2 z-50">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => reportMessage(message.id)}
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Report
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatTime(message.created_at)}
                          </span>
                        )}
                      </div>
                      
                      {isCurrentUser && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage 
                            src={message.user?.photo_url} 
                            alt={message.user?.name || 'You'} 
                          />
                          <AvatarFallback className="text-xs">
                            You
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  );
                })}
                
                {/* Typing Indicator */}
                <AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex gap-3 justify-start"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          </div>
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted text-foreground rounded-2xl px-4 py-2 border">
                        <p className="text-sm text-muted-foreground">Someone is typing...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t bg-background/95 backdrop-blur-sm p-4">
              {/* File Upload Options */}
              <AnimatePresence>
                {showFileOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3 flex gap-2"
                  >
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
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          <Image className="h-4 w-4 mr-2" />
                          Image
                        </span>
                      </Button>
                    </label>
                    <label htmlFor="video-upload">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          <Video className="h-4 w-4 mr-2" />
                          Video
                        </span>
                      </Button>
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Message Input */}
              <div className="flex gap-2 items-end">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFileOptions(!showFileOptions)}
                  className="shrink-0"
                >
                  <Image className="h-5 w-5" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="resize-none border-2 focus:border-primary/50"
                  />
                </div>
                
                <Button
                  onClick={sendMessage}
                  disabled={!messageInput.trim()}
                  size="icon"
                  className="shrink-0"
                  style={{
                    background: currentTheme
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primaryDark})`
                      : 'hsl(var(--primary))'
                  }}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
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
                    : 'hsl(var(--primary))'
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