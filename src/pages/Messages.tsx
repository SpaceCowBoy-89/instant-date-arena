import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Heart, Send, ArrowLeft, User, UserMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: Date;
}

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi there! Nice to meet you 😊", sender: "them", timestamp: new Date() },
    { id: "2", text: "Hello! Great to meet you too!", sender: "me", timestamp: new Date() },
    { id: "3", text: "I'm so glad we matched! That was a fun conversation.", sender: "them", timestamp: new Date() },
    { id: "4", text: "I know right! I really enjoyed talking with you too 💕", sender: "me", timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const matchInfo = {
    name: "Sarah",
    age: 26,
    interests: ["Photography", "Yoga", "Cooking"],
    bio: "Adventure seeker and coffee enthusiast"
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: "me",
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage("");

    // Simulate response from match
    setTimeout(() => {
      const responses = [
        "That's so interesting!",
        "I totally agree!",
        "Tell me more about that!",
        "That sounds amazing!",
        "I've always wanted to try that too!",
        "You're really fun to talk to!",
        "I'm so glad we matched!",
        "What do you like to do on weekends?",
      ];
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: "them",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  const handleUnmatch = () => {
    toast({
      title: "Unmatched",
      description: `You have unmatched with ${matchInfo.name}`,
    });
    navigate("/lobby");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 header-safe">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/lobby")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="text-center">
            <h1 className="text-xl font-semibold">Messages</h1>
            <p className="text-sm text-muted-foreground">Matched with {matchInfo.name}</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <UserMinus className="h-5 w-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unmatch with {matchInfo.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. You will no longer be able to message each other.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleUnmatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Unmatch
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
          {/* Match Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-2">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-gradient-to-br from-romance to-purple-accent text-white text-xl">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{matchInfo.name}, {matchInfo.age}</CardTitle>
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4 text-romance fill-romance" />
                  <span>Matched!</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Bio</p>
                  <p className="text-sm">{matchInfo.bio}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {matchInfo.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Heart className="h-5 w-5 text-romance fill-romance" />
                  Matched Chat
                </CardTitle>
              </CardHeader>
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === "me"
                          ? "bg-gradient-to-r from-romance to-purple-accent text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="border-t p-4">
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
            </Card>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Messages;