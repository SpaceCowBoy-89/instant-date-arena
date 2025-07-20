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

const Profile = () => {
  const [ageRange, setAgeRange] = useState([22, 35]);
  const [maxDistance, setMaxDistance] = useState([24901]);
  const [genderPreference, setGenderPreference] = useState("Women");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [lookingFor, setLookingFor] = useState("Long-term relationship");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load user profile on component mount
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

      // If profile exists, populate the form
      if (profile) {
        setName(profile.name || "");
        setAge(profile.age?.toString() || "");
        setBio(profile.bio || "");
        setGender(profile.gender || "");
        setLocation(profile.location || "");
        setPhotoUrl(profile.photo_url || "");
        
        // Parse preferences from JSON
        const prefs = (profile.preferences as any) || {};
        setInterests(Array.isArray(prefs.interests) ? prefs.interests : []);
        setLookingFor(typeof prefs.looking_for === 'string' ? prefs.looking_for : "Long-term relationship");
        setAgeRange(Array.isArray(prefs.age_range) ? prefs.age_range : [22, 35]);
        setMaxDistance(Array.isArray(prefs.max_distance) ? prefs.max_distance : [24901]);
        setGenderPreference(typeof prefs.gender_preference === 'string' ? prefs.gender_preference : "Women");
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

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);
      
      toast({
        title: "Photo uploaded!",
        description: "Your profile photo has been updated successfully",
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
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
      
      navigate("/lobby");
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
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your Profile</h1>
              <p className="text-muted-foreground">Make a great first impression</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Photo */}
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
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="photo-upload"
                    disabled={uploading}
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

            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tell others a bit about yourself
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Your age"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
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

            {/* Interests */}
            <Card>
              <CardHeader>
                <CardTitle>Interests & Hobbies</CardTitle>
                <CardDescription>
                  What do you love doing? This helps find compatible matches.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge
                      key={interest}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeInterest(interest)}
                    >
                      {interest} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest..."
                    onKeyPress={(e) => e.key === "Enter" && addInterest()}
                  />
                  <Button variant="soft" onClick={addInterest}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dating Preferences */}
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
                        setMaxDistance([24901]); // Earth's circumference
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

            {/* Account Actions */}
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
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start border-2 border-romance/30 bg-romance/5 hover:bg-romance/10"
                  onClick={() => navigate('/billing')}
                >
                  Billing & Upgrades
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button variant="soft" onClick={() => navigate("/lobby")} className="flex-1">
                Skip for now
              </Button>
              <Button variant="romance" onClick={handleSave} className="flex-1" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Profile;