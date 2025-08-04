import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Mic, ArrowLeft, User, Pin, PinOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

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
    {
      id: "1",
      name: "Alex",
      avatar: "📸",
      lastMessage: "Hey, how was your day?",
      timestamp: "03:45 PM",
      unreadCount: 0,
      isPinned: true,
    },
    {
      id: "2", 
      name: "Gaming Group",
      avatar: "🎮",
      lastMessage: "Anyone up for a game tonight?",
      timestamp: "02:30 PM",
      unreadCount: 3,
      isPinned: true,
    },
    {
      id: "3",
      name: "Sam",
      avatar: "🌿",
      lastMessage: "Thanks for the coffee recommendation!",
      timestamp: "01:15 PM", 
      unreadCount: 1,
      isPinned: true,
    },
    {
      id: "4",
      name: "Book Club",
      avatar: "📚",
      lastMessage: "New event tonight...",
      timestamp: "03:15 PM",
      unreadCount: 1,
      isPinned: false,
    },
    {
      id: "5",
      name: "Music Fans",
      avatar: "🎵",
      lastMessage: "Join us tomorrow...",
      timestamp: "02:45 PM", 
      unreadCount: 2,
      isPinned: false,
    },
  ]);

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
    // Check if pinned section needs horizontal scroll on small screens
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
    ));

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
    ));

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
    }));

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
    // Navigate to individual chat view
    navigate(`/chat/${chatId}`);
  };

  const PinnedChatCard = ({ chat }: { chat: ChatThread }) => (
    <Card className="min-w-[280px] border border-message-border shadow-md shadow-message-shadow/20 hover:scale-[1.02] transition-transform duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-message-pin-gold">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-lg">{chat.avatar}</AvatarFallback>
            </Avatar>
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
  );

  const RegularChatCard = ({ chat }: { chat: ChatThread }) => (
    <Card className="border border-message-border hover:scale-[1.02] transition-transform duration-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-lg">{chat.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-black text-base truncate">{chat.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-message-text-light">{chat.timestamp}</span>
                  {chat.unreadCount > 0 && (
                    <Badge className="bg-message-pin-red text-white h-4 w-4 rounded-full text-xs p-0 flex items-center justify-center">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-message-text-light truncate">{chat.lastMessage}</p>
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
  );

  return (
    <div className="min-h-screen bg-message-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-message-header border-b border-message-border">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/lobby")}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-message-title">Messages</h1>
              <span className="text-sm text-message-text-light">{formatCurrentTime()}</span>
            </div>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-message-border p-3">
            <Search className="h-8 w-8 text-message-text" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent text-message-text placeholder:text-message-text-light focus-visible:ring-0 flex-1"
            />
            <Mic className="h-8 w-8 text-message-mic" />
          </div>
        </div>

        {/* Pinned Conversations */}
        {filteredPinnedChats.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-message-text mb-3">Pinned Conversations</h2>
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                {filteredPinnedChats.map((chat) => (
                  <PinnedChatCard key={chat.id} chat={chat} />
                ))}
              </div>
              {showScrollHint && (
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
                    onClick={() => navigate("/lobby")}
                    className="bg-message-blue hover:bg-message-blue/90 text-white"
                  >
                    Start Speed Dating
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredChats.map((chat) => (
              <RegularChatCard key={chat.id} chat={chat} />
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