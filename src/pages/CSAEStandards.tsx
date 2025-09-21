import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, AlertTriangle, Users, Eye, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CSAEStandards = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Child Safety & Protection Standards
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our comprehensive approach to preventing child sexual abuse and exploitation (CSAE) 
            through technology, policy, and community safety measures.
          </p>
        </div>

        {/* Key Standards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <CardTitle>Content Monitoring</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AI-powered content detection systems</li>
                <li>• 24/7 automated monitoring protocols</li>
                <li>• Human review of flagged content</li>
                <li>• Immediate removal of harmful material</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>User Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Age verification processes</li>
                <li>• Identity authentication systems</li>
                <li>• Restricted access for minors</li>
                <li>• Parental consent mechanisms</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle>Reporting System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• One-click reporting mechanisms</li>
                <li>• Anonymous reporting options</li>
                <li>• Direct law enforcement coordination</li>
                <li>• User protection during investigations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Legal Compliance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• NCMEC CyberTipline reporting</li>
                <li>• International law enforcement cooperation</li>
                <li>• COPPA and GDPR compliance</li>
                <li>• Regular safety audits</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Policies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Comprehensive CSAE Prevention Framework</CardTitle>
            <CardDescription>
              Detailed policies and procedures to ensure child safety
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Zero Tolerance Policy</h3>
              <p className="text-sm text-muted-foreground">
                We maintain a strict zero-tolerance policy for any content, behavior, or communication 
                that could harm, exploit, or endanger children. Violations result in immediate account 
                termination and law enforcement notification.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-foreground mb-2">2. Proactive Detection Systems</h3>
              <p className="text-sm text-muted-foreground">
                Our platform employs advanced machine learning algorithms and hash-matching technology 
                to proactively identify and remove known CSAE material. We also use behavioral analysis 
                to detect suspicious patterns of communication or content sharing.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Mandatory Reporting</h3>
              <p className="text-sm text-muted-foreground">
                All suspected CSAE incidents are immediately reported to the National Center for Missing 
                & Exploited Children (NCMEC) and relevant law enforcement agencies. We maintain detailed 
                logs and preserve evidence to assist in investigations.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-foreground mb-2">4. User Education & Awareness</h3>
              <p className="text-sm text-muted-foreground">
                We provide comprehensive safety education, clear community guidelines, and regular 
                awareness campaigns to help users identify and report suspicious behavior. Our platform 
                includes built-in safety tools and resources.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-foreground mb-2">5. Continuous Improvement</h3>
              <p className="text-sm text-muted-foreground">
                We regularly review and update our safety measures based on emerging threats, 
                technological advances, and feedback from child safety experts, law enforcement, 
                and advocacy organizations.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Report Concerns</CardTitle>
            <CardDescription>
              If you encounter content or behavior that may harm children
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Emergency Situations</h4>
                <p className="text-sm text-muted-foreground">
                  If a child is in immediate danger, contact local emergency services (911 in the US) 
                  or your local police department immediately.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Report to Our Platform</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Use our in-app reporting tools or contact our safety team directly.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/support/contact')}
                  className="text-sm"
                >
                  Contact Safety Team
                </Button>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">External Reporting</h4>
                <p className="text-sm text-muted-foreground">
                  Report suspected CSAE directly to NCMEC at{" "}
                  <a 
                    href="https://www.missingkids.org/gethelpnow/cybertipline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    CyberTipline
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Navigation */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CSAEStandards;