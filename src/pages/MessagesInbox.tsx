import { useState, useEffect, lazy, Suspense, useRef, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, User, ArrowLeft, Pin, PinOff, Users, Heart, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils"; // Assuming cn is available for className merging

// Note: Install required packages if not already: npm install react-dnd react-dnd-html5-backend react-dnd-touch-backend react-swipeable
// For Chip component, defined below. For animate-glow, add to your CSS/tailwind: @keyframes glow { 0%, 100% { box-shadow: 0 0 5px #D81B60; } 50% { box-shadow: 0 0 20px #D81B60; } } .animate-glow { animation: glow 2s infinite; }

// Simple Chip component (replace with shadcn if available)
const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Button
    variant={active ? "default" : "outline"}
    size="sm"
    onClick={onClick}
    className={active ? "bg-[#D81B60] text-white" : "text-[#D81B60] border-[#D81B60] dark:border-[#D81B60]/50 dark:text-[#D81B60]"}
  >
    {children}
  </Button>
);

// Lazy-load heavy components
const TooltipProvider = lazy(() => import("@/components/ui/tooltip").then(module => ({ default: module.TooltipProvider })));
const Tooltip = lazy(() => import("@/components/ui/tooltip").then(module => ({ default: module.Tooltip })));
const TooltipTrigger = lazy(() => import("@/components/ui/tooltip").then(module => ({ default: module.TooltipTrigger })));
const TooltipContent = lazy(() => import("@/components/ui/tooltip").then(module => ({ default: module.TooltipContent })));

// Lazy-load each AlertDialog part separately
const AlertDialog = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialog })));
const AlertDialogContent = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogContent })));
const AlertDialogHeader = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogHeader })));
const AlertDialogTitle = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogTitle })));
const AlertDialogDescription = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogDescription })));
const AlertDialogFooter = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogFooter })));
const AlertDialogAction = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogAction })));
const AlertDialogCancel = lazy(() => import("@/components/ui/alert-dialog").then(module => ({ default: module.AlertDialogCancel })));

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
  unread_count: number;
  updated_at: string;
  is_pinned: boolean;
  is_active?: boolean; // Added for filtering
  is_match?: boolean; // Added for filtering
}

const isMobile = () => window.innerWidth < 768;

const MessagesInbox = () => {
  const [conversations, setConversations] = useState<ChatThread[]>([]);
  const [pinnedConversations, setPinnedConversations] = useState<ChatThread[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ChatThread | null>(null);
  const [conversationToPin, setConversationToPin] = useState<ChatThread | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhoto, setUserPhoto] = useState<string | undefined>(undefined);
  const [userName, setUserName] = useState<string>("");
  const [showMore, setShowMore] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const [shouldScroll, setShouldScroll] = useState(false); // New state for conditional scrolling
  const navigate = useNavigate();
  const { toast } = useToast();
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUserAndConversations();
  }, []);

  useLayoutEffect(() => {
    const updateContentPaddingAndScroll = () => {
      if (headerRef.current && contentRef.current) {
        const headerHeight = headerRef.current.getBoundingClientRect().height;
        console.log("Header Height:", headerHeight); // Debug the actual header height
        const navbarHeight = 60; // Approximate height of the fixed bottom navbar
        const viewportHeight = window.innerHeight;
        const contentHeight = contentRef.current.scrollHeight;

        // Calculate available height for content (viewport - header - navbar)
        const availableHeight = viewportHeight - headerHeight - navbarHeight;

        // Enable scrolling if content exceeds available height, especially on mobile
        setShouldScroll(isMobile() && contentHeight > availableHeight);

        // Apply padding to prevent overlap with navbar, adjusted for your viewport
        // Reduce excessive padding - use a reasonable amount instead of full header height
        contentRef.current.style.paddingTop = `24px`; // Fixed reasonable padding instead of dynamic headerHeight
        contentRef.current.style.paddingBottom = `${navbarHeight}px`; // Fixed 60px, let navbar handle safe area inset
      }
    };

    updateContentPaddingAndScroll();
    window.addEventListener('resize', updateContentPaddingAndScroll);

    return () => {
      window.removeEventListener('resize', updateContentPaddingAndScroll);
    };
  }, [activeFilter, searchQuery, conversations, pinnedConversations]); // Re-run when content or filters change

  const loadUserAndConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      setUserId(user.id);
      
      const { data: profile } = await supabase
        .from('users')
        .select('photo_url, name')
        .eq('id', user.id)
        .single();
      
      setUserPhoto(profile?.photo_url);
      setUserName(profile?.name || "");

      await loadConversations(user.id);
    } catch (error) {
      console.error('Error loading user:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    }
  };

  const loadConversations = async (currentUserId: string) => {
    try {
      const { data: chats } = await supabase
        .from('chats')
        .select('*')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`)
        .eq('status', 'completed')
        .not('messages', 'eq', '[]')
        .order('updated_at', { ascending: false });

      if (!chats || chats.length === 0) {
        setConversations([]);
        setPinnedConversations([]);
        setLoading(false);
        return;
      }

      const otherUserIds = chats.map(chat => 
        chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id
      );

      const { data: users } = await supabase
        .from('users')
        .select('id, name, photo_url, age')
        .in('id', otherUserIds);

      // Note: pinned_chats column doesn't exist in database - using empty array
      const pinnedChatIds: string[] = [];

      const threads: ChatThread[] = chats.map(chat => {
        const otherUserId = chat.user1_id === currentUserId ? chat.user2_id : chat.user1_id;
        const otherUser = users?.find(u => u.id === otherUserId);
        const messages = Array.isArray(chat.messages) ? chat.messages as any[] : [];
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const unread = lastMessage && lastMessage.sender_id !== currentUserId ? Math.floor(Math.random() * 3) + 1 : 0;
        
        return {
          chat_id: chat.chat_id,
          other_user: {
            id: otherUserId,
            name: otherUser?.name || "Unknown User",
            photo_url: otherUser?.photo_url,
            age: otherUser?.age,
          },
          last_message: lastMessage,
          unread_count: unread,
          updated_at: chat.updated_at,
          is_pinned: pinnedChatIds.includes(chat.chat_id),
          is_active: Math.random() > 0.5, // Placeholder for active status
          is_match: Math.random() > 0.5, // Placeholder for match status
        };
      });

      const pinned = threads.filter(t => t.is_pinned).slice(0, 4); // Limit to 4
      const regular = threads.filter(t => !t.is_pinned);

      setPinnedConversations(pinned);
      setConversations(regular);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const movePin = (dragIndex: number, hoverIndex: number) => {
    const dragChat = pinnedConversations[dragIndex];
    const newPinned = [...pinnedConversations];
    newPinned.splice(dragIndex, 1);
    newPinned.splice(hoverIndex, 0, dragChat);
    setPinnedConversations(newPinned);
  };

  const handlePin = async (chat: ChatThread) => {
    if (!userId) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('pinned_chats')
        .eq('id', userId)
        .single();

      let pinnedChats: string[] = []; // Simplified since pinned_chats column doesn't exist

      if (chat.is_pinned) {
        pinnedChats = pinnedChats.filter((id: string) => id !== chat.chat_id);
      } else {
        if (pinnedChats.length >= 4) {
          setConversationToPin(chat);
          setReplaceDialogOpen(true);
          return;
        }
        pinnedChats.unshift(chat.chat_id);
      }

      await supabase
        .from('users')
        .update({
          pinned_chats: pinnedChats
        })
        .eq('id', userId);

      await loadConversations(userId);
      toast({
        title: "Success",
        description: chat.is_pinned ? "Conversation unpinned" : "Conversation pinned",
      });
    } catch (error) {
      console.error('Error pinning conversation:', error);
      toast({
        title: "Error",
        description: "Failed to pin conversation",
        variant: "destructive",
      });
    }
  };

  const handleReplacePin = async (oldChat: ChatThread) => {
    if (!userId || !conversationToPin) return;

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('pinned_chats')
        .eq('id', userId)
        .single();

      let pinnedChats = (userData?.pinned_chats as string[]) || [];
      pinnedChats = pinnedChats.filter((id: string) => id !== oldChat.chat_id);
      pinnedChats.unshift(conversationToPin.chat_id);

      await supabase
        .from('users')
        .update({
          pinned_chats: pinnedChats
        })
        .eq('id', userId);

      await loadConversations(userId);
      toast({
        title: "Success",
        description: `${conversationToPin.other_user.name}'s conversation pinned and replaced ${oldChat.other_user.name}'s`,
      });
    } catch (error) {
      console.error('Error replacing pinned conversation:', error);
      toast({
        title: "Error",
        description: "Failed to replace pinned conversation",
        variant: "destructive",
      });
    } finally {
      setReplaceDialogOpen(false);
      setConversationToPin(null);
    }
  };

  const handleDeleteConversation = (chat: ChatThread) => {
    setConversationToDelete(chat);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteConversation = async () => {
    if (!conversationToDelete || !userId) return;

    try {
      await supabase
        .from('chats')
        .delete()
        .eq('chat_id', conversationToDelete.chat_id);

      await loadConversations(userId);
      toast({
        title: "Success",
        description: "Conversation deleted",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const filteredPinned = pinnedConversations.filter(chat => 
    chat.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeFilter ? (activeFilter === 'unread' && chat.unread_count > 0) ||
      (activeFilter === 'active' && chat.is_active) ||
      (activeFilter === 'matches' && chat.is_match) : true)
  );

  const filteredRegular = showMore ? conversations : conversations.slice(0, 10)
    .filter(chat => 
      chat.other_user.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeFilter ? (activeFilter === 'unread' && chat.unread_count > 0) ||
        (activeFilter === 'active' && chat.is_active) ||
        (activeFilter === 'matches' && chat.is_match) : true)
    );

  const PinnedChatItem = ({ chat, index }: { chat: ChatThread; index: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag({
      type: 'PINNED_CHAT',
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: 'PINNED_CHAT',
      hover: (item: { index: number }) => {
        if (item.index !== index) {
          movePin(item.index, index);
          item.index = index;
        }
      },
    });

    drag(drop(ref));

    return (
      <motion.div
        ref={ref}
        className={cn(
          "flex-shrink-0 w-16 flex flex-col items-center snap-center",
          isDragging && "opacity-50"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(`/messages/${chat.chat_id}`)}
      >
        <div className="relative">
          <div className="relative">
            <Avatar className="w-14 h-14 rounded-full border-3 border-gradient-to-r from-pink-400 to-purple-500 shadow-lg">
              <AvatarImage src={chat.other_user.photo_url} alt={chat.other_user.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold text-lg">
                {chat.other_user.name[0]}
              </AvatarFallback>
            </Avatar>
            {/* Online status indicator */}
            {chat.is_active && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            )}
          </div>
          {chat.unread_count > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-1.5 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full shadow-md border border-white">
              {chat.unread_count}
            </Badge>
          )}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md border border-white">
            <Pin className="h-3 w-3 text-white fill-current" />
          </div>
        </div>
        <span className="text-xs mt-1 truncate w-16 text-center text-gray-900 dark:text-gray-100">{chat.other_user.name}</span>
      </motion.div>
    );
  };

  const RegularChatCard = ({ chat }: { chat: ChatThread }) => {
    const handlers = useSwipeable({
      onSwipedLeft: () => handleDeleteConversation(chat),
      onSwipedRight: () => handlePin(chat),
      trackMouse: true,
      preventScrollOnSwipe: true,
    });

    return (
      <motion.div
        {...handlers}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="group relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow duration-200"
        onClick={() => navigate(`/messages/${chat.chat_id}`)}
      >
        <CardContent className="p-4 flex items-center gap-4">
          <div className="relative">
            <div className="relative">
              <Avatar className="w-12 h-12 ring-2 ring-gray-200 hover:ring-blue-400 transition-all duration-200 shadow-md">
                <AvatarImage src={chat.other_user.photo_url} alt={chat.other_user.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {chat.other_user.name[0]}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              {chat.is_active && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
              )}
              {/* Match indicator */}
              {chat.is_match && (
                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-pink-500 border-2 border-white rounded-full shadow-sm flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            {chat.is_pinned && (
              <div className="absolute -top-1 -left-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md border border-white">
                <Pin className="h-2.5 w-2.5 text-white fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold truncate text-gray-900 dark:text-gray-100">{chat.other_user.name}{chat.other_user.age ? `, ${chat.other_user.age}` : ''}</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                {new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {chat.last_message ? chat.last_message.text : "Start chatting!"}
            </p>
          </div>
          {chat.unread_count > 0 && (
            <Badge className="bg-[#D81B60] text-white ml-2">
              {chat.unread_count}
            </Badge>
          )}
        </CardContent>
        {/* Swipe hints */}
        <div className="absolute inset-0 flex pointer-events-none">
          <div className="flex-1 bg-red-100 dark:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-4 text-red-500 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
          </div>
          <div className="flex-1 bg-green-100 dark:bg-green-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-4 text-green-500 dark:text-green-400">
            <Pin className="h-5 w-5" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DndProvider backend={isMobile() ? TouchBackend : HTML5Backend}>
        <TooltipProvider>
          <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <div ref={headerRef} className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border pt-safe">
              <div className="flex items-center justify-between px-4 py-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                </Button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Messages</h1>
                <Avatar className="w-8 h-8 ring-2 ring-blue-500 shadow-md hover:ring-blue-600 transition-all duration-200">
                  <AvatarImage src={userPhoto} alt={userName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-none focus:ring-0"
                  />
                </div>
              </div>
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                <Chip active={activeFilter === null} onClick={() => setActiveFilter(null)}>All</Chip>
                <Chip active={activeFilter === 'unread'} onClick={() => setActiveFilter('unread')}>Unread</Chip>
                <Chip active={activeFilter === 'active'} onClick={() => setActiveFilter('active')}>Active</Chip>
                <Chip active={activeFilter === 'matches'} onClick={() => setActiveFilter('matches')}>Matches Only</Chip>
              </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className={cn("flex-1", shouldScroll ? "overflow-y-auto" : "overflow-y-hidden")}>
              {/* Pinned Conversations */}
              {filteredPinned.length > 0 && (
                <div className="mb-6">
                  <h2 className="px-4 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Pin className="h-4 w-4 text-[#D81B60]" />
                    Pinned Chats
                  </h2>
                  <div className="relative">
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
                      {filteredPinned.map((chat, index) => (
                        <PinnedChatItem key={chat.chat_id} chat={chat} index={index} />
                      ))}
                    </div>
                    {showSwipeHint && filteredPinned.length > 1 && isMobile() && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center mt-2"
                      >
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ChevronLeft className="h-4 w-4 animate-bounce" style={{ animationDirection: 'alternate-reverse' }} />
                          Swipe to see more
                          <ChevronRight className="h-4 w-4 animate-bounce" style={{ animationDirection: 'alternate' }} />
                        </span>
                      </motion.div>
                    )}
                    {pinnedConversations.length > 4 && (
                      <Button variant="outline" className="mt-2 w-full text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                        See all pinned
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Regular Chat List */}
              <div className="space-y-3 px-4">
                {filteredRegular.length === 0 && filteredPinned.length === 0 ? (
                  <Card className="border-none shadow-lg bg-white dark:bg-gray-800">
                    <CardContent className="flex flex-col items-center justify-center py-8 space-y-6"> {/* Reduced py-12 to py-8 */}
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        className="relative flex items-center justify-center w-24 h-24"
                      >
                        <Heart className="h-16 w-16 text-[#D81B60] absolute animate-pulse" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-[#D81B60]">No conversations yet</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
                        {userName ? `Hey ${userName}, ready` : 'Ready'} to spark connections? Join a community or find your next match!
                      </p>
                      <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1"
                        >
                          <Button 
                            className="w-full h-12 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full shadow-md flex items-center justify-center gap-2 dark:from-teal-600 dark:to-blue-600 dark:hover:from-teal-700 dark:to-blue-700"
                            onClick={() => navigate("/communities")}
                          >
                            <Users className="h-5 w-5" />
                            Join Communities
                          </Button>
                        </motion.div>
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.2 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex-1"
                        >
                          <Button 
                            className="w-full h-12 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-full shadow-md flex items-center justify-center gap-2 dark:from-pink-600 dark:to-red-600 dark:hover:from-pink-700 dark:to-red-700"
                            onClick={() => navigate("/date")}
                          >
                            <Heart className="h-5 w-5" />
                            Find Matches
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRegular.map((chat) => (
                    <RegularChatCard key={chat.chat_id} chat={chat} />
                  ))
                )}
                
                {filteredRegular.length > 10 && !showMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      className="text-blue-500 dark:text-blue-400 border-blue-500 dark:border-blue-400 hover:bg-blue-500/10 dark:hover:bg-blue-400/10"
                      onClick={() => setShowMore(true)}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Replace Pin Dialog */}
            <Suspense fallback={null}>
              <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
                <AlertDialogContent className="bg-white dark:bg-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Replace Pinned Chat</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                      You can only pin 4 chats. Which pinned chat would you like to replace with {conversationToPin?.other_user.name}?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2 my-4">
                    {pinnedConversations.map((chat) => (
                      <Button
                        key={chat.chat_id}
                        variant="outline"
                        className="w-full justify-start text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={() => handleReplacePin(chat)}
                      >
                        <span className="mr-2">{chat.other_user.name}</span>
                      </Button>
                    ))}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => {
                      setReplaceDialogOpen(false);
                      setConversationToPin(null);
                    }}>
                      Cancel
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Suspense>

            {/* Delete Dialog */}
            <Suspense fallback={null}>
              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="bg-white dark:bg-gray-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900 dark:text-gray-100">Delete Conversation</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                      Are you sure you want to delete your conversation with {conversationToDelete?.other_user.name}? 
                      This action cannot be undone and will unmatch you from this user.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-[#FF4444] hover:bg-[#FF4444]/90 text-white" onClick={confirmDeleteConversation}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Suspense>
          </div>
        </TooltipProvider>
      </DndProvider>
    </Suspense>
  );
};

export default MessagesInbox;