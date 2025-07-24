import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Flag, UserX, AlertTriangle, CheckCircle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserVerification } from "@/components/UserVerification";
import Navbar from "@/components/Navbar";

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
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
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

      // Load verification status
      const { data: userData } = await supabase
        .from('users')
        .select('verification_status')
        .eq('id', user.id)
        .single();

      if (userData) {
        const status = userData.verification_status as 'unverified' | 'pending' | 'verified' | 'rejected';
        setVerificationStatus(status || 'unverified');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted pb-20">
      <div className="mobile-container header-safe">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-sm py-4 -mx-4 px-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Safety Center</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Manage your safety and security settings</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Verification Section */}
            <UserVerification 
              currentStatus={verificationStatus}
              onVerificationSubmitted={() => {
                setVerificationStatus('pending');
                loadSafetyData();
              }}
            />

            {/* Community Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-romance" />
                  Community Guidelines
                </CardTitle>
                <CardDescription>
                  Help us maintain a safe and respectful community
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <Shield className="h-6 w-6 mx-auto mb-2 text-romance" />
                    <div className="text-sm font-medium">Be Respectful</div>
                    <div className="text-xs text-muted-foreground">Treat everyone with kindness</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <div className="text-sm font-medium">Be Authentic</div>
                    <div className="text-xs text-muted-foreground">Use real photos and information</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => navigate("/terms")}>
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
                  <div className="text-center py-8 text-muted-foreground">
                    <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No blocked users</p>
                    <p className="text-sm">Users you block will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-romance to-purple-accent rounded-full flex items-center justify-center text-white font-medium">
                            {blockedUser.blocked_user?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="font-medium">{blockedUser.blocked_user?.name || 'Unknown User'}</div>
                            <div className="text-sm text-muted-foreground">
                              Blocked {new Date(blockedUser.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblockUser(blockedUser.id, blockedUser.blocked_user?.name || 'User')}
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Flag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reports submitted</p>
                    <p className="text-sm">Reports you submit will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userReports.map((report) => (
                      <div key={report.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">{getReportTypeLabel(report.report_type)}</div>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reported {report.reported_user?.name || 'Unknown User'} on{' '}
                          {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Emergency & Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="destructive" className="w-full">
                  Report Emergency Situation
                </Button>
                <div className="text-xs text-muted-foreground text-center">
                  For immediate safety concerns, contact local emergency services.
                  This button is for reporting urgent safety issues on the platform.
                </div>
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