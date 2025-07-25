import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Camera, User, ArrowLeft, Save, Loader2, Heart, Settings, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { InterestsPicker } from "@/components/InterestsPicker";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserVerification } from "@/components/UserVerification";


const Profile = () => {
  const [ageRange, setAgeRange] = useState([22, 35]);
  const [maxDistance, setMaxDistance] = useState([24901]);
  const [genderPreference, setGenderPreference] = useState("Women");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("Long-term relationship");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
        return;
      }

      if (profile) {
        setName(profile.name || "");
        setAge(profile.age?.toString() || "");
        setBio(profile.bio || "");
        setGender(profile.gender || "");
        setLocation(profile.location || "");
        setPhotoUrl(profile.photo_url || "");
        
        const status = profile.verification_status as 'unverified' | 'pending' | 'verified' | 'rejected';
        setVerificationStatus(status || 'unverified');
        
        const prefs = (profile.preferences as any) || {};
        setInterests(Array.isArray(prefs.interests) ? prefs.interests : []);
        setLookingFor(typeof prefs.looking_for === 'string' ? prefs.looking_for : "Long-term relationship");
        setAgeRange(Array.isArray(prefs.age_range) ? prefs.age_range : [22, 35]);
        setMaxDistance(Array.isArray(prefs.max_distance) ? prefs.max_distance : [24901]);
        setGenderPreference(typeof prefs.gender_preference === 'string' ? prefs.gender_preference : "Women");
      } else {
        const fullName = user.user_metadata?.full_name;
        if (fullName) {
          setName(fullName);
        }
      }
    } catch (error) {
      console.error('Error in loadProfile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 Starting photo upload:', file.name, file.size, file.type);

    try {
      // More strict validation for mobile
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Reduced file size limit for mobile stability
      const maxSize = 3 * 1024 * 1024; // 3MB instead of 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 3MB",
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication error",
          description: "Please sign in again",
          variant: "destructive",
        });
        return;
      }

      // Create a more efficient file processing approach for mobile
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        toast({
          title: "Unsupported file format",
          description: "Please use JPG, PNG, GIF, or WebP format",
          variant: "destructive",
        });
        return;
      }

      const fileName = `${user.id}/profile.${fileExt}`;
      console.log('📁 Uploading to:', fileName);

      // Upload with optimized settings for mobile
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      console.log('🔗 Public URL:', publicUrl);

      // Update state immediately for better UX
      setPhotoUrl(publicUrl);
      
      // Update database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          photo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        // Don't throw here - the upload worked, just log the error
        toast({
          title: "Upload successful",
          description: "Photo uploaded but database update failed. Please try saving your profile.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Photo uploaded!",
          description: "Your profile photo has been updated successfully",
        });
      }

    } catch (error) {
      console.error('Photo upload error:', error);
      
      // More specific error handling
      let errorMessage = "Failed to upload photo. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('413')) {
          errorMessage = "File too large. Please select a smaller image.";
        } else if (error.message.includes('401')) {
          errorMessage = "Authentication expired. Please sign in again.";
        } else if (error.message.includes('network')) {
          errorMessage = "Network error. Please check your connection.";
        }
      }
      
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      
      // Clear the input to allow re-upload of the same file
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSave = async () => {
    const missingFields = [];
    if (!age || parseInt(age) < 18) {
      missingFields.push("Age (must be 18 or older)");
    }
    if (!gender) {
      missingFields.push("Gender");
    }
    if (!location) {
      missingFields.push("Location");
    }

    if (missingFields.length > 0) {
      setValidationMessage(`Please complete the following required fields: ${missingFields.join(", ")}`);
      setShowValidationDialog(true);
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/");
        return;
      }

      const profileData = {
        id: user.id,
        name: name.trim(),
        age: age ? parseInt(age) : null,
        bio: bio.trim(),
        gender: gender.trim(),
        location: location.trim(),
        photo_url: photoUrl.trim(),
        preferences: {
          interests,
          looking_for: lookingFor,
          age_range: ageRange,
          max_distance: maxDistance,
          gender_preference: genderPreference,
        },
      };

      const { error } = await supabase
        .from('users')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Error saving profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile saved successfully!",
      });
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="mobile-container header-safe">
        <div className="max-w-2xl mx-auto pb-24">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">Your Profile</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Make a great first impression</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-romance" />
                  Profile Photo
                </CardTitle>
                <CardDescription>
                  Upload a clear, recent photo that shows your personality
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={photoUrl || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl bg-gradient-to-br from-romance to-purple-accent text-white">
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="photo-upload"
                    disabled={uploading}
                    capture="environment"
                  />
                  <Button 
                    variant="soft" 
                    className="w-full max-w-xs" 
                    disabled={uploading}
                    asChild
                  >
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? "Uploading..." : "Upload Photo"}
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tell others a bit about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^[a-zA-Z\s]*$/.test(value)) {
                          setName(value);
                        }
                      }}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Select value={age} onValueChange={setAge}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 82 }, (_, i) => i + 18).map((ageOption) => (
                          <SelectItem key={ageOption} value={ageOption.toString()}>
                            {ageOption}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, State"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people about yourself..."
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interests & Hobbies</CardTitle>
                <CardDescription>
                  Choose from our curated list of interests to help find compatible matches. Select up to 10 interests.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InterestsPicker
                  selectedInterests={interests}
                  onInterestsChange={setInterests}
                  maxSelections={10}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-romance" />
                  Dating Preferences
                </CardTitle>
                <CardDescription>
                  Help us find your perfect matches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Looking for</Label>
                  <Select value={lookingFor} onValueChange={setLookingFor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long-term relationship">Long-term relationship</SelectItem>
                      <SelectItem value="Casual dating">Casual dating</SelectItem>
                      <SelectItem value="Friendship">Friendship</SelectItem>
                      <SelectItem value="Not sure yet">Not sure yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Show me</Label>
                  <Select value={genderPreference} onValueChange={setGenderPreference}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Women">Women</SelectItem>
                      <SelectItem value="Men">Men</SelectItem>
                      <SelectItem value="Everyone">Everyone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Age range: {ageRange[0]} - {ageRange[1]}</Label>
                  <Slider
                    value={ageRange}
                    onValueChange={setAgeRange}
                    min={18}
                    max={65}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Maximum distance: {maxDistance[0] > 100 ? "∞ (Show everyone)" : `${maxDistance[0]} miles`}</Label>
                  <Slider
                    value={maxDistance}
                    onValueChange={(value) => {
                      if (value[0] > 100) {
                        setMaxDistance([24901]);
                      } else {
                        setMaxDistance(value);
                      }
                    }}
                    min={0}
                    max={101}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <UserVerification 
              currentStatus={verificationStatus}
              onVerificationSubmitted={() => {
                setVerificationStatus('pending');
                loadProfile();
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-romance" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => navigate('/settings')}
                >
                  Settings & Privacy
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6 pb-6">
              <Button
                variant="outline"
                onClick={() => navigate("/lobby")}
                className="w-full order-2 sm:order-1"
                size="lg"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full order-1 sm:order-2"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Navbar />

      <AlertDialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Your Profile</AlertDialogTitle>
            <AlertDialogDescription>
              {validationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowValidationDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profile;
