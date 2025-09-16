import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Share2, Facebook, X, MessageCircle, Instagram, Copy, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Share = () => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get the current URL and ensure it's properly formatted
  const currentUrl = window.location.href;
  const appUrl = currentUrl.startsWith('http') ? currentUrl : `https://${window.location.host}`;
  const appName = "SpeedHeart";
  const shareText = `Check out ${appName} - Find your perfect match through speed dating! 💕`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: appName,
          text: shareText,
          url: appUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Thanks for sharing SpeedHeart!",
        });
      } catch (error) {
        console.log('Native share cancelled or failed');
        toast({
          title: "Share cancelled",
          description: "The share action was cancelled or failed.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Native share unavailable",
        description: "Native sharing is not supported on this device.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "App link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareToFacebook = () => {
    const validUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    console.log('Sharing URL to Facebook:', validUrl);
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(validUrl)}`;
    
    try {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
      toast({
        title: "Opened Facebook share",
        description: "Share SpeedHeart on Facebook!",
      });
    } catch (error) {
      console.error('Facebook share error:', error);
      toast({
        title: "Share failed",
        description: "Unable to open Facebook share dialog. Please try again.",
        variant: "destructive",
      });
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({
      title: "Opened X share",
      description: "Share SpeedHeart on X!",
    });
  };

  const shareToWhatsApp = () => {
    const text = `${shareText} ${appUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    toast({
      title: "Opened WhatsApp share",
      description: "Share SpeedHeart on WhatsApp!",
    });
  };

  const shareToInstagram = () => {
    handleCopyLink();
    toast({
      title: "Link copied for Instagram",
      description: "Paste the link in your Instagram story or post!",
    });
  };

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
          <h1 className="text-2xl font-bold text-foreground truncate">Share</h1>
          <p className="text-muted-foreground text-sm">Share SpeedHeart with others</p>
        </div>
      </div>
      
      <div className="p-4 pb-32 md:pb-20 lg:max-w-3xl lg:mx-auto">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-romance" />
                Share SpeedHeart
              </CardTitle>
              <CardDescription>
                Help others find love by sharing SpeedHeart with your friends!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {navigator.share && (
                <Button onClick={handleNativeShare} className="w-full" variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share App
                </Button>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button onClick={shareToFacebook} variant="outline" size="sm">
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </Button>
                
                <Button onClick={shareToTwitter} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  X
                </Button>
                
                <Button onClick={shareToWhatsApp} variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
                
                <Button onClick={shareToInstagram} variant="outline" size="sm">
                  <Instagram className="h-4 w-4 mr-2" />
                  Instagram
                </Button>
              </div>

              <Button onClick={handleCopyLink} variant="ghost" className="w-full">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>

      <Navbar />
    </div>
  );
};

export default Share;