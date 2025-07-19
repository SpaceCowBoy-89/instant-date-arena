import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Send, Clock, ThumbsUp, ThumbsDown, ArrowLeft, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Message {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: Date;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", text: "Hi there! Nice to meet you 😊", sender: "them", timestamp: new Date() },
    { id: "2", text: "Hello! Great to meet you too!", sender: "me", timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [decision, setDecision] = useState<"like" | "pass" | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const matchInfo = {
    name: "Sarah",
    age: 26,
    interests: ["Photography", "Yoga", "Cooking"],
    bio: "Adventure seeker and coffee enthusiast"
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isTimeUp) return;

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

  const handleDecision = (choice: "like" | "pass") => {
    setDecision(choice);
    // TODO: Send decision to backend
    setTimeout(() => {
      navigate("/lobby");
    }, 2000);
  };

  const progressPercentage = ((180 - timeLeft) / 180) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        {/* Header */}
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
          
          <div className="w-10" /> {/* Spacer for balance */}
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
                  Speed Date Chat
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

              {/* Message Input or Decision */}
              {!isTimeUp ? (
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
              ) : (
                <div className="border-t p-6 text-center">
                  {decision ? (
                    <div className="space-y-4">
                      <p className="text-lg font-semibold">
                        {decision === "like" ? "Great choice! 💕" : "Thanks for being honest! 👍"}
                      </p>
                      <p className="text-muted-foreground">
                        {decision === "like" 
                          ? "If Sarah likes you too, you'll be able to continue chatting!"
                          : "You'll be returned to the lobby to find another match."
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold">Time's up! ⏰</h3>
                      <p className="text-muted-foreground">
                        What did you think of your conversation with {matchInfo.name}?
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
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;