import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Mic, ArrowLeft, User, Pin, PinOff, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useInView } from "react-intersection-observer"; // For lazy loading
import debounce from "lodash/debounce"; // For search debounce

interface ChatThread {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isPinned: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [chatToPin, setChatToPin] = useState<ChatThread | null>(null);
  const [chatToReplace, setChatToReplace] = useState<ChatThread | null>(null);
  const [chats, setChats] = useState<ChatThread[]>([
    { id: "1", name: "Alex", avatar: "A", lastMessage: "Hey, how was your day?", timestamp: "03:45 PM", unreadCount: 0, isPinned: true },
    { id: "2", name: "Gaming Group", avatar: "🎮", lastMessage: "Anyone up for a game tonight?", timestamp: "02:30 PM", unreadCount: 3, isPinned: true },
    { id: "3", name: "Sam", avatar: "S", lastMessage: "Thanks for the coffee recommendation!", timestamp: "01:15 PM", unreadCount: 1, isPinned: true },
    { id: "4", name: "Book Club", avatar: "📚", lastMessage: "New event tonight...", timestamp: "03:15 PM", unreadCount: 1, isPinned: false },
    { id: "5", name: "Music Fans", avatar: "🎵", lastMessage: "Join us tomorrow...", timestamp: "02:45 PM", unreadCount: 2, isPinned: false },
  ]);
  const [isVerticalLayout, setIsVerticalLayout] = useState(false);

  const pinnedChats = chats.filter(chat => chat.isPinned);
  const regularChats = chats.filter(chat => !chat.isPinned);

  const filteredChats = regularChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPinnedChats = pinnedChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const checkScrollHint = () => {
      if (window.innerWidth < 600 && pinnedChats.length >= 3) {
        setShowScrollHint(true);
      } else {
        setShowScrollHint(false);
      }
    };
    checkScrollHint();
    window.addEventListener('resize', checkScrollHint);
    return () => window.removeEventListener('resize', checkScrollHint);
  }, [pinnedChats.length]);

  const handlePinChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    const currentPinnedCount = chats.filter(c => c.isPinned).length;
    
    if (currentPinnedCount >= 3) {
      setChatToPin(chat);
      setShowReplaceDialog(true);
      return;
    }

    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, isPinned: true } : c
    ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));

    toast({
      title: "Chat Pinned",
      description: `${chat.name} has been pinned to the top`,
    });
  };

  const handleUnpinChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, isPinned: false } : c
    ).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));

    toast({
      title: "Chat Unpinned", 
      description: `${chat.name} has been unpinned`,
    });
  };

  const handleReplacePin = (replaceId: string) => {
    if (!chatToPin) return;

    setChats(prev => prev.map(c => {
      if (c.id === replaceId) return { ...c, isPinned: false };
      if (c.id === chatToPin.id) return { ...c, isPinned: true };
      return c;
    }).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));

    toast({
      title: "Pin Replaced",
      description: `${chatToPin.name} is now pinned`,
    });

    setShowReplaceDialog(false);
    setChatToPin(null);
    setChatToReplace(null);
  };

  const formatCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const openChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  // Debounced search handler
  const debouncedSetSearchQuery = useCallback(
    debounce((query) => setSearchQuery(query), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSetSearchQuery(e.target.value);
  };

  // Lazy-loaded chat card
  const ChatCard = ({ chat, isPinned }: { chat: ChatThread; isPinned: boolean }) => {
    const { ref, inView } = useInView({
      triggerOnce: true,
      threshold: 0.1,
    });

    if (!inView) {
      return <div ref={ref} style={{ height: '100px' }} />; // Placeholder for lazy loading
    }

    const CardComponent = isPinned ? PinnedChatCard : RegularChatCard;
    return <CardComponent ref={ref} chat={chat} />;
  };

  const PinnedChatCard = React.forwardRef<HTMLDivElement, { chat: ChatThread }>(({ chat }, ref) => (
    <Card ref={ref} className="min-w-[280px] border border-message-border shadow-md shadow-message-shadow/20 hover:transform hover:scale-[1.02] hover:transition-transform hover:duration-200 hover:ease-out">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-gradient-to-r from-amber-400 to-orange-500 shadow-lg hover:shadow-xl transition-all duration-200">
                <AvatarImage src={`/avatars/${chat.name.toLowerCase()}.svg`} alt={`${chat.name} avatar`} className="object-cover" />
                <AvatarFallback className="text-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold shadow-inner">
                  {chat.avatar}
                </AvatarFallback>
              </Avatar>
              {/* Pinned status indicator */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                <Pin className="h-2.5 w-2.5 text-white fill-current" />
              </div>
              {/* Active status indicator */}
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-black text-base">{chat.name}</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleUnpinChat(chat.id)}
            className="h-5 w-5 p-0 text-message-pin-red hover:text-message-pin-red/80"
          >
            <PinOff className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => openChat(chat.id)}
          className="w-full bg-message-blue hover:bg-message-blue/90 text-white h-10"
        >
          Open
        </Button>
      </CardContent>
    </Card>
  ));

  const RegularChatCard = React.forwardRef<HTMLDivElement, { chat: ChatThread }>(({ chat }, ref) => (
    <Card ref={ref} className="border border-message-border hover:transform hover:scale-[1.02] hover:transition-transform hover:duration-200 hover:ease-out">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-10 w-10 ring-2 ring-gray-200 hover:ring-blue-400 transition-all duration-200 shadow-md hover:shadow-lg">
                <AvatarImage src={`/avatars/${chat.name.toLowerCase()}.svg`} alt={`${chat.name} avatar`} className="object-cover" />
                <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                  {chat.avatar}
                </AvatarFallback>
              </Avatar>
              {/* Online status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-900 text-base truncate" style={{ fontSize: chat.unreadCount > 0 ? '1.1rem' : '1rem' }}>
                  {chat.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{chat.timestamp}</span>
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-message-pin-red text-white h-4 w-4 rounded-full text-xs p-0 flex items-center justify-center">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 truncate" title={chat.lastMessage}>
                {chat.lastMessage}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            <Button
              onClick={() => openChat(chat.id)}
              className="bg-message-blue hover:bg-message-blue/90 text-white h-10 px-4"
            >
              Open
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePinChat(chat.id)}
              className="h-5 w-5 p-0 text-message-pin-gold hover:text-message-pin-gold/80"
            >
              <Pin className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  ));

  return (
    <div className="min-h-screen bg-message-background relative" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-message-header border-b border-message-border">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/communities")}
              className="h-10 w-10"
              aria-label="Back to communities"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-message-title">Messages</h1>
              <span className="text-sm text-message-text-light">{formatCurrentTime()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/new-chat")}
              className="h-10 w-10"
              aria-label="Start new chat"
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Avatar className="h-10 w-10 ring-2 ring-blue-500 shadow-lg hover:ring-blue-600 transition-all duration-200">
              <AvatarImage src="/placeholder.svg" className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-message-border p-3">
            <Search className="h-8 w-8 text-message-text" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="border-0 bg-transparent text-message-text placeholder:text-message-text-light focus-visible:ring-0 flex-1"
              style={{ position: 'relative', top: 0, transition: 'top 0.3s ease' }}
            />
            <Mic className="h-8 w-8 text-message-mic" />
          </div>
        </div>

        {/* Pinned Conversations */}
        {filteredPinnedChats.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-message-text">Pinned Conversations</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVerticalLayout(!isVerticalLayout)}
                className="text-message-text-light"
              >
                {isVerticalLayout ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
            <div className={`relative ${isVerticalLayout ? 'flex-col space-y-3' : 'flex gap-3 overflow-x-auto scrollbar-hide pb-2'}`}>
              {filteredPinnedChats.map((chat) => (
                <ChatCard key={chat.id} chat={chat} isPinned={true} />
              ))}
              {showScrollHint && !isVerticalLayout && (
                <div className="flex justify-center mt-2">
                  <span className="text-xs text-message-text-light">Swipe to see more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Regular Chat List */}
        <div className="space-y-3">
          {filteredChats.length === 0 && filteredPinnedChats.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
                <p className="text-message-text-light text-center mb-4">
                  {searchQuery ? "Try adjusting your search" : "Start speed dating to find matches!"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => navigate("/communities")}
                    className="bg-message-blue hover:bg-message-blue/90 text-white"
                  >
                    Explore Communities
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredChats.map((chat) => (
              <ChatCard key={chat.id} chat={chat} isPinned={false} />
            ))
          )}
          
          {filteredChats.length > 0 && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                className="text-message-blue border-message-blue hover:bg-message-blue/10"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Replace Pin Dialog */}
      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace Pinned Chat</AlertDialogTitle>
            <AlertDialogDescription>
              You can only pin 3 chats. Which pinned chat would you like to replace with {chatToPin?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4">
            {pinnedChats.map((chat) => (
              <Button
                key={chat.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleReplacePin(chat.id)}
              >
                <span className="mr-2">{chat.avatar}</span>
                {chat.name}
              </Button>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowReplaceDialog(false);
              setChatToPin(null);
            }}>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Navbar />
    </div>
  );
};

export default Messages;