import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Flag, UserX, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Capacitor } from "@capacitor/core";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  blocked_user?: {
    name: string;
    photo_url: string;
  };
}

interface UserReport {
  id: string;
  report_type: string;
  status: string;
  created_at: string;
  reported_user?: {
    name: string;
  };
}

const SafetyCenter = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadSafetyData();
  }, []);

  const loadSafetyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }


      // Load blocked users
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select(`
          id,
          blocked_id,
          created_at,
          blocked_user:users!blocked_users_blocked_id_fkey(name, photo_url)
        `)
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });

      if (blocked) {
        setBlockedUsers(blocked.map(block => ({
          ...block,
          blocked_user: Array.isArray(block.blocked_user) ? block.blocked_user[0] : block.blocked_user
        })) as BlockedUser[]);
      }

      // Load user reports
      const { data: reports } = await supabase
        .from('user_reports')
        .select(`
          id,
          report_type,
          status,
          created_at,
          reported_user:users!user_reports_reported_user_id_fkey(name)
        `)
        .eq('reporter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reports) {
        setUserReports(reports.map(report => ({
          ...report,
          reported_user: Array.isArray(report.reported_user) ? report.reported_user[0] : report.reported_user
        })) as UserReport[]);
      }
    } catch (error) {
      console.error('Error loading safety data:', error);
      toast({
        title: "Error",
        description: "Failed to load safety information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockUser = async (blockId: string, userName: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('id', blockId);

      if (error) {
        console.error('Unblock error:', error);
        toast({
          title: "Error",
          description: "Failed to unblock user",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "User Unblocked",
        description: `${userName} has been unblocked`,
      });

      // Refresh blocked users list
      setBlockedUsers(prev => prev.filter(user => user.id !== blockId));
    } catch (error) {
      console.error('Unblock error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      inappropriate_content: 'Inappropriate Content',
      harassment: 'Harassment',
      fake_profile: 'Fake Profile',
      spam: 'Spam',
      underage: 'Underage User',
      other: 'Other'
    };
    return types[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-500';
      case 'reviewing':
        return 'bg-yellow-500';
      case 'dismissed':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="mobile-container" style={{ paddingBottom: '5rem' }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 sticky top-0 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 z-10 border-b border-border/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-11 w-11 shrink-0 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Safety Center</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">Manage your safety and security settings</p>
            </div>
          </div>

          <div className="space-y-6">

            {/* Community Guidelines */}
            <Card className="border-romance/20">
              <CardHeader className="space-y-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-romance shrink-0" />
                  Community Guidelines
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Help us maintain a safe and respectful community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-romance/5 to-romance/10 rounded-xl border border-romance/20">
                    <Shield className="h-8 w-8 mx-auto mb-3 text-romance" />
                    <div className="text-sm font-medium mb-1">Be Respectful</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">Treat everyone with kindness and respect</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl border border-green-500/20">
                    <CheckCircle className="h-8 w-8 mx-auto mb-3 text-green-500" />
                    <div className="text-sm font-medium mb-1">Be Authentic</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">Use real photos and honest information</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full h-12 text-sm touch-manipulation" 
                  onClick={() => navigate("/terms")}
                >
                  Read Full Community Guidelines
                </Button>
              </CardContent>
            </Card>

            {/* Blocked Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-500" />
                  Blocked Users
                  <Badge variant="secondary">{blockedUsers.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Users you've blocked won't be able to contact you or see your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                {blockedUsers.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <UserX className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium mb-1">No blocked users</p>
                    <p className="text-sm leading-relaxed">Users you block will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border border-border/50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center text-white font-medium text-lg shrink-0">
                            {blockedUser.blocked_user?.name?.charAt(0) || '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">{blockedUser.blocked_user?.name || 'Unknown User'}</div>
                            <div className="text-xs text-muted-foreground">
                              Blocked {new Date(blockedUser.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockUser(blockedUser.id, blockedUser.blocked_user?.name || 'User')}
                          className="h-9 px-3 text-xs touch-manipulation shrink-0"
                        >
                          Unblock
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-orange-500" />
                  Report History
                  <Badge variant="secondary">{userReports.length}</Badge>
                </CardTitle>
                <CardDescription>
                  Track the status of reports you've submitted
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userReports.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Flag className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="font-medium mb-1">No reports submitted</p>
                    <p className="text-sm leading-relaxed">Reports you submit will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userReports.map((report) => (
                      <div key={report.id} className="p-4 bg-muted/50 rounded-xl border border-border/50">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="font-medium text-sm flex-1">{getReportTypeLabel(report.report_type)}</div>
                          <Badge className={`${getStatusColor(report.status)} text-white text-xs px-2 py-1 shrink-0`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                          Reported {report.reported_user?.name || 'Unknown User'} on{' '}
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default SafetyCenter;