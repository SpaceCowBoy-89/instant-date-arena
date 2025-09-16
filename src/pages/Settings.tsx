import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Settings as SettingsIcon, Shield, HelpCircle, Eye, Share2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Settings = () => {
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Load existing settings on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        navigate("/");
        return;
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const showSaved = () => {
    setShowSavedIndicator(true);
    setTimeout(() => setShowSavedIndicator(false), 3000);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        title: "Error", 
        description: "An unexpected error occurred while signing out.",
        variant: "destructive",
      });
    }
  };

  const filteredSections = () => ({
    visibility: true,
    account: true,
    help: true,
    verification: true,
    share: true,
  });

  const filters = filteredSections();

  return (
    <div className="min-h-screen bg-background mobile-container header-safe">
      <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground truncate">Settings</h1>
          <p className="text-muted-foreground text-sm">Customize your dating preferences</p>
        </div>
      </div>
      
      <div className="p-4 pb-32 md:pb-20 lg:max-w-3xl lg:mx-auto">
        {showSavedIndicator && (
          <Alert className="mb-4">
            <AlertDescription>Saved!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {filters.visibility && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-romance" />
                  Visibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/visibility')}>
                  <span>Visibility Settings</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
                <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/notifications')}>
                  <span>Notifications</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.verification && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-romance" />
                  Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/verification')}>
                  <span>Verification</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.account && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-romance" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="soft" 
                  className="w-full justify-start"
                  onClick={() => setPasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Legal</h3>
                  <Button
                    variant="link"
                    className="w-full justify-between p-0"
                    onClick={() => navigate("/privacy")}
                  >
                    <span>Privacy Policy</span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                  <Button
                    variant="link"
                    className="w-full justify-between p-0"
                    onClick={() => navigate("/terms")}
                  >
                    <span>Terms of Service</span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </div>

                <Button variant="soft" className="w-full justify-start" onClick={handleSignOut}>
                  Sign Out
                </Button>
                
                <Button 
                  variant="soft" 
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={() => navigate("/account-deletion-request")}
                >
                  Request Account Deletion
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.help && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-romance" />
                  Help
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="link"
                  className="w-full justify-between p-0"
                  onClick={() => navigate("/safety")}
                >
                  <span>Safety Center</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="link"
                  className="w-full justify-between p-0"
                  onClick={() => navigate("/support/contact")}
                >
                  <span>Support</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="link"
                  className="w-full justify-between p-0"
                  onClick={() => navigate("/support/faq")}
                >
                  <span>FAQ</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          )}

          {filters.share && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-romance" />
                  Share
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="link" className="w-full justify-between p-0" onClick={() => navigate('/share')}>
                  <span>Share SpeedHeart</span>
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
      
      <ChangePasswordDialog
        open={passwordDialogOpen} 
        onOpenChange={setPasswordDialogOpen} 
      />
      
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      
      <Navbar />
    </div>
  );
};

export default Settings;