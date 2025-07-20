import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Settings as SettingsIcon, Heart, Bell, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [ageRange, setAgeRange] = useState([22, 35]);
  const [maxDistance, setMaxDistance] = useState([25]);
  const [lookingFor, setLookingFor] = useState("Long-term relationship");
  const [genderPreference, setGenderPreference] = useState("Women");
  const [notifications, setNotifications] = useState(true);
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);
  const navigate = useNavigate();

  const handleSave = () => {
    // TODO: Save to Supabase database
    console.log("Saving settings:", {
      ageRange,
      maxDistance: maxDistance[0],
      lookingFor,
      genderPreference,
      notifications,
      showAge,
      showDistance,
    });
    navigate("/lobby");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/50 to-muted">
      <div className="container mx-auto px-4 py-8">
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
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Customize your dating preferences</p>
            </div>
          </div>

          <div className="space-y-6">
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
                  <Label>Maximum distance: {maxDistance[0]} miles</Label>
                  <Slider
                    value={maxDistance}
                    onValueChange={setMaxDistance}
                    min={1}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-romance" />
                  Privacy
                </CardTitle>
                <CardDescription>
                  Control what others can see about you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show my age</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see your age on your profile
                    </p>
                  </div>
                  <Switch checked={showAge} onCheckedChange={setShowAge} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show distance</Label>
                    <p className="text-sm text-muted-foreground">
                      Let others see how far away you are
                    </p>
                  </div>
                  <Switch checked={showDistance} onCheckedChange={setShowDistance} />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-romance" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Stay updated on your matches and messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new matches and messages
                    </p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-romance" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => navigate('/profile')}
                >
                  Edit Profile
                </Button>
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => navigate('/billing')}
                >
                  Billing & Upgrades
                </Button>
                
                <Button variant="soft" className="w-full justify-start">
                  Change Password
                </Button>
                <Button variant="soft" className="w-full justify-start">
                  Delete Account
                </Button>
                <Button variant="soft" className="w-full justify-start">
                  Privacy Policy
                </Button>
                <Button variant="soft" className="w-full justify-start">
                  Terms of Service
                </Button>
                
                <Button
                  variant="soft"
                  onClick={() => navigate('/lobby')}
                  className="w-full justify-start"
                >
                  Back to Lobby
                </Button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button variant="soft" onClick={() => navigate("/lobby")} className="flex-1">
                Cancel
              </Button>
              <Button variant="romance" onClick={handleSave} className="flex-1">
                Save Preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;