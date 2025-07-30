import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Flag, Ban, Heart, MapPin, User as UserIcon, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReportUserDialog } from "@/components/ReportUserDialog";
import { BlockUserDialog } from "@/components/BlockUserDialog";

interface UserData {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  location?: string;
  photo_url?: string;
  photos?: any;
  preferences?: any;
  verification_status?: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reportDialog, setReportDialog] = useState(false);
  const [blockDialog, setBlockDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/");
        return;
      }

      setCurrentUser(authUser);

      // If viewing own profile, redirect to main profile page
      if (userId === authUser.id) {
        navigate("/profile");
        return;
      }

      // Load the user's profile
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUser(userData);
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
      navigate("/connections");
    } finally {
      setLoading(false);
    }
  };

  const handleReportUser = () => {
    setReportDialog(true);
  };

  const handleBlockUser = () => {
    setBlockDialog(true);
  };

  const getInterests = () => {
    if (!user?.preferences || typeof user.preferences !== 'object') return [];
    return user.preferences.interests || [];
  };

  const getLookingFor = () => {
    if (!user?.preferences || typeof user.preferences !== 'object') return '';
    return user.preferences.lookingFor || '';
  };

  const getGenderPreference = () => {
    if (!user?.preferences || typeof user.preferences !== 'object') return '';
    return user.preferences.genderPreference || '';
  };

  const getAgeRange = () => {
    if (!user?.preferences || typeof user.preferences !== 'object') return [18, 99];
    return user.preferences.ageRange || [18, 99];
  };

  const getPhotos = () => {
    if (!user?.photos) return [];
    if (Array.isArray(user.photos)) return user.photos;
    return [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The user profile you're looking for could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/connections")} className="w-full">
              Back to Connections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const photos = getPhotos();
  const interests = getInterests();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/connections")}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReportUser}>
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBlockUser} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.photo_url || photos[0]} />
                <AvatarFallback className="text-2xl">
                  {user.name?.[0]?.toUpperCase() || <UserIcon className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-2xl">{user.name}</CardTitle>
                  {user.verification_status === 'verified' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Verified
                    </Badge>
                  )}
                </div>
                {user.age && (
                  <p className="text-muted-foreground">Age: {user.age}</p>
                )}
                {user.location && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          {user.bio && (
            <CardContent>
              <p className="text-foreground">{user.bio}</p>
            </CardContent>
          )}
        </Card>

        {/* Photos */}
        {photos.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo: string, index: number) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={photo} 
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interests */}
        {interests.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {interests.map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Looking For */}
        {getLookingFor() && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Looking For</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{getLookingFor()}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Report Dialog */}
      <ReportUserDialog
        open={reportDialog}
        onOpenChange={setReportDialog}
        reportedUserId={user.id}
        reportedUserName={user.name}
      />

      {/* Block Dialog */}
      <BlockUserDialog
        open={blockDialog}
        onOpenChange={setBlockDialog}
        blockedUserId={user.id}
        blockedUserName={user.name}
        onUserBlocked={() => {
          navigate("/connections");
        }}
      />
    </div>
  );
};

export default UserProfile;