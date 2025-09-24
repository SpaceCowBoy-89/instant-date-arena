import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Clock, MessageCircle, Heart, Users, Swords, Bell, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import Navbar from "@/components/Navbar";

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  sent_at: string;
  status: string;
}

const NotificationHistoryPage = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from('notification_logs')
        .select('id, type, title, message, sent_at, status')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50); // Show more on dedicated page

      if (error) {
        throw error;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notification history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('notification_logs')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      toast({
        title: "History cleared",
        description: "All notification history has been cleared",
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear notification history",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'group_message':
        return <Users className="h-4 w-4" />;
      case 'direct_message':
        return <MessageCircle className="h-4 w-4" />;
      case 'match':
        return <Heart className="h-4 w-4" />;
      case 'arena':
        return <Swords className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'group_message':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900';
      case 'direct_message':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900';
      case 'match':
        return 'text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900';
      case 'arena':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'group_message':
        return 'Group Chat';
      case 'direct_message':
        return 'Message';
      case 'match':
        return 'Match';
      case 'arena':
        return 'Arena';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="min-h-screen bg-background mobile-container">
      <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground truncate">Notification History</h1>
          <p className="text-muted-foreground text-sm">Your recent notification activity</p>
        </div>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearAllNotifications}
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
            title="Clear all notifications"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="p-4 lg:max-w-3xl lg:mx-auto" style={{ paddingBottom: '8rem' }}>
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  You'll see your notifications here when you receive them
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className={`h-10 w-10 ${getNotificationColor(notification.type)}`}>
                      <AvatarFallback className="text-sm">
                        {getNotificationIcon(notification.type)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-base truncate">
                          {notification.title}
                        </h4>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {getTypeLabel(notification.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Navbar />
    </div>
  );
};

export default NotificationHistoryPage;