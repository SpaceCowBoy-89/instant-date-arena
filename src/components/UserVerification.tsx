import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, Clock, AlertCircle, Phone, Mail, Camera, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserVerificationProps {
  currentStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  onVerificationSubmitted?: () => void;
}

export const UserVerification = ({ currentStatus = 'unverified', onVerificationSubmitted }: UserVerificationProps) => {
  const [verificationType, setVerificationType] = useState<'phone' | 'email' | 'id_document' | 'social_media'>('phone');
  const [verificationData, setVerificationData] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Verified';
    }
  };

  const getStatusDescription = () => {
    switch (currentStatus) {
      case 'verified':
        return 'Your identity has been verified. You now have access to all features.';
      case 'pending':
        return 'Your verification is being reviewed. This typically takes 24-48 hours.';
      case 'rejected':
        return 'Your verification was rejected. Please try again with different information.';
      default:
        return 'Complete verification to access all features and build trust with other users.';
    }
  };

  const getVerificationIcon = () => {
    switch (verificationType) {
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'id_document':
        return <Camera className="h-4 w-4" />;
      case 'social_media':
        return <Share2 className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getInputPlaceholder = () => {
    switch (verificationType) {
      case 'phone':
        return 'Enter your phone number';
      case 'email':
        return 'Enter your email address';
      case 'social_media':
        return 'Enter your social media profile URL';
      default:
        return '';
    }
  };

  const handleSubmitVerification = async () => {
    if (!verificationData.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide the required verification information.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to submit verification.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_verifications')
        .insert({
          user_id: user.id,
          verification_type: verificationType,
          verification_data: { value: verificationData },
          status: 'pending'
        });

      if (error) {
        console.error('Verification submission error:', error);
        toast({
          title: "Submission Failed",
          description: "Failed to submit verification. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update user verification status to pending
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          verification_status: 'pending',
          verification_submitted_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('User status update error:', updateError);
      }

      toast({
        title: "Verification Submitted",
        description: "Your verification has been submitted for review. You'll be notified of the result within 24-48 hours.",
      });

      setVerificationData('');
      onVerificationSubmitted?.();
    } catch (error) {
      console.error('Verification error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-romance/20">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-romance shrink-0" />
            Identity Verification
          </CardTitle>
          <Badge 
            variant={currentStatus === 'verified' ? 'default' : 'secondary'} 
            className="flex items-center gap-1 text-xs px-2 py-1 shrink-0"
          >
            {getStatusIcon()}
            <span className="hidden sm:inline">{getStatusText()}</span>
          </Badge>
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>

      {currentStatus === 'unverified' || currentStatus === 'rejected' ? (
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label htmlFor="verification-type" className="text-sm font-medium">Verification Method</Label>
            <Select value={verificationType} onValueChange={(value: any) => setVerificationType(value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Choose verification method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone" className="py-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Phone Number</div>
                      <div className="text-xs text-muted-foreground">Verify via SMS</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="email" className="py-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Email Address</div>
                      <div className="text-xs text-muted-foreground">Verify via email link</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="social_media" className="py-3">
                  <div className="flex items-center gap-3">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Social Media Profile</div>
                      <div className="text-xs text-muted-foreground">Link your social profile</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label htmlFor="verification-data" className="text-sm font-medium">
              <div className="flex items-center gap-2">
                {getVerificationIcon()}
                Verification Information
              </div>
            </Label>
            <Input
              id="verification-data"
              value={verificationData}
              onChange={(e) => setVerificationData(e.target.value)}
              placeholder={getInputPlaceholder()}
              disabled={verificationType === 'id_document'}
              className="h-12 text-sm"
            />
          </div>

          <Button 
            onClick={handleSubmitVerification}
            className="w-full h-12 text-sm font-medium"
            disabled={loading || verificationType === 'id_document'}
            variant="romance"
          >
            {loading ? "Submitting..." : "Submit for Verification"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-2 bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 shrink-0" />
              <span>Verification helps create a safer community</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 shrink-0" />
              <span>All information is kept secure and private</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 shrink-0" />
              <span>Review typically takes 24-48 hours</span>
            </div>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <div className="text-center py-6">
            <div className="mb-3">
              {getStatusIcon()}
            </div>
            <div className="text-muted-foreground text-sm leading-relaxed">
              {currentStatus === 'pending' 
                ? "We're reviewing your verification. Check back soon!"
                : "Thank you for verifying your identity!"
              }
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};