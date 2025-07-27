import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Facebook, Twitter, MessageCircle, Instagram, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ShareApp = () => {
  const [copied, setCopied] = useState(false);
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
      } catch (error) {
        console.log('Native share cancelled or failed');
      }
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
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareToFacebook = () => {
    // Validate URL format
    const validUrl = appUrl.startsWith('http') ? appUrl : `https://${appUrl}`;
    console.log('Sharing URL to Facebook:', validUrl);
    
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(validUrl)}`;
    
    try {
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
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
  };

  const shareToWhatsApp = () => {
    const text = `${shareText} ${appUrl}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct URL sharing, so we'll copy the link
    handleCopyLink();
    toast({
      title: "Link copied for Instagram",
      description: "Paste the link in your Instagram story or post!",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share App
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
        
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={shareToFacebook} variant="outline" size="sm">
            <Facebook className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          
          <Button onClick={shareToTwitter} variant="outline" size="sm">
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
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
  );
};

export default ShareApp;