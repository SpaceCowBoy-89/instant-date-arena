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
      case 'id_document':
        return 'Upload ID document (feature coming soon)';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-romance" />
          Identity Verification
          <Badge variant={currentStatus === 'verified' ? 'default' : 'secondary'} className="ml-auto">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </CardTitle>
        <CardDescription>
          {getStatusDescription()}
        </CardDescription>
      </CardHeader>

      {currentStatus === 'unverified' || currentStatus === 'rejected' ? (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-type">Verification Method</Label>
            <Select value={verificationType} onValueChange={(value: any) => setVerificationType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose verification method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </div>
                </SelectItem>
                <SelectItem value="social_media">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Social Media Profile
                  </div>
                </SelectItem>
                <SelectItem value="id_document" disabled>
                  <div className="flex items-center gap-2 opacity-50">
                    <Camera className="h-4 w-4" />
                    ID Document (Coming Soon)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verification-data">
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
            />
          </div>

          <Button 
            onClick={handleSubmitVerification}
            className="w-full"
            disabled={loading || verificationType === 'id_document'}
            variant="romance"
          >
            {loading ? "Submitting..." : "Submit for Verification"}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Verification helps create a safer community</p>
            <p>• All information is kept secure and private</p>
            <p>• Review typically takes 24-48 hours</p>
          </div>
        </CardContent>
      ) : (
        <CardContent>
          <div className="text-center py-4">
            <div className="text-muted-foreground text-sm">
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