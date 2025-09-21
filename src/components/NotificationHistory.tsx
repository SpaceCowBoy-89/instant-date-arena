import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MessageCircle, Heart, Users, Swords, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  sent_at: string;
  status: string;
}

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notification_logs')
        .select('id, type, title, message, sent_at, status')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(20);

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-romance" />
            Recent Notifications
          </CardTitle>
          <CardDescription>
            Your latest notification activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-romance" />
          Recent Notifications
        </CardTitle>
        <CardDescription>
          Your latest notification activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              You'll see your notifications here when you receive them
            </p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Avatar className={`h-8 w-8 ${getNotificationColor(notification.type)}`}>
                    <AvatarFallback className="text-xs">
                      {getNotificationIcon(notification.type)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {notification.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.sent_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationHistory;