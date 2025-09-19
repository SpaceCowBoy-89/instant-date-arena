import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between px-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl" style={{ paddingBottom: '6rem' }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">SpeedHeart Privacy Policy</CardTitle>
            <p className="text-muted-foreground text-center">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Introduction</h2>
              <p>
                SpeedHeart ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
                how we collect, use, disclose, and safeguard your information when you use our mobile application and 
                related services (collectively, the "Service").
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">2.1 Personal Information You Provide</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Account Information:</strong> Name, email address, date of birth, gender identity</li>
                    <li><strong>Profile Information:</strong> Photos, bio, interests, location preferences</li>
                    <li><strong>Communication Data:</strong> Messages, chat transcripts, interaction history</li>
                    <li><strong>Identity Verification:</strong> Age verification data (when required)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">2.2 Automatically Collected Information</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                    <li><strong>Usage Data:</strong> App interaction patterns, feature usage, session duration</li>
                    <li><strong>Location Information:</strong> Approximate location for matching purposes (with consent)</li>
                    <li><strong>Technical Data:</strong> IP address, browser type, connection information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">2.3 Third-Party Information</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Information from social media platforms (if you choose to connect them)</li>
                    <li>Information from identity verification services</li>
                    <li>Analytics and advertising partner data</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. How We Use Your Information</h2>
              
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">3.1 Primary Service Functions</h3>
                  <ul className="list-disc ml-6 space-y-1">
                  <li>Create and maintain your account</li>
                  <li>Facilitate matching with other users based on preferences</li>
                  <li>Enable text communication features</li>
                  <li>Process and deliver messages between users</li>
                  <li>Maintain chat history and interaction records</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">3.2 Safety and Security</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Monitor for prohibited content and behavior</li>
                    <li>Prevent fraud, spam, and abuse</li>
                    <li>Verify user identity and age</li>
                    <li>Investigate and respond to user reports</li>
                    <li>Maintain platform integrity and user safety</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">3.3 Service Improvement</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Analyze usage patterns to improve features</li>
                    <li>Develop new functionalities</li>
                    <li>Optimize matching algorithms</li>
                    <li>Provide customer support</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. Data Safety and Security Measures</h2>
              
              <div className="space-y-3">
                <h3 className="font-semibold">4.1 Technical Safeguards</h3>
                <ul className="list-disc ml-6 space-y-1">
                
                  <li>Secure data transmission using TLS/SSL protocols</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Multi-factor authentication options</li>
                  <li>Automated threat detection systems</li>
                </ul>

                <h3 className="font-semibold">4.2 Access Controls</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Role-based access controls for employees</li>
                  <li>Regular access reviews and updates</li>
                  <li>Data minimization practices</li>
                  <li>Secure data storage with encryption at rest</li>
                </ul>

              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Information Sharing and Disclosure</h2>
              
              <div className="space-y-3">
                <h3 className="font-semibold">5.1 We DO NOT sell your personal information</h3>
                <p>SpeedHeart does not sell, rent, or trade your personal information to third parties for monetary gain.</p>

                <h3 className="font-semibold">5.2 Limited Sharing Scenarios</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>With Other Users:</strong> Only profile information you choose to display</li>
                  <li><strong>Service Providers:</strong> Trusted partners who assist in app operations (under strict contracts)</li>
                  <li><strong>Legal Compliance:</strong> When required by law or to protect rights and safety</li>
                  <li><strong>Business Transfers:</strong> In case of merger or acquisition (with user notification)</li>
                </ul>

                <h3 className="font-semibold">5.3 Anonymous Data</h3>
                <p>
                  We may share aggregated, anonymized data that cannot identify individual users for research, 
                  analytics, and business purposes.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Your Privacy Rights and Controls</h2>
              
              <div className="space-y-3">
                <h3 className="font-semibold">6.1 Account Management</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Access and update your profile information</li>
                  <li>Control visibility of your profile and photos</li>
                  <li>Manage location sharing preferences</li>
                  <li>Set communication preferences</li>
                </ul>

                <h3 className="font-semibold">6.2 Data Rights</h3>
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Access:</strong> Request copies of your personal data</li>
                  <li><strong>Correction:</strong> Update inaccurate information</li>
                  <li><strong>Deletion:</strong> Request account and data deletion</li>
                  <li><strong>Portability:</strong> Export your data in a common format</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                </ul>

                <h3 className="font-semibold">6.3 Marketing Communications</h3>
                <p>You can opt out of promotional emails and notifications at any time through app settings or email unsubscribe links.</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Data Retention</h2>
              
              <div className="space-y-2">
                <ul className="list-disc ml-6 space-y-1">
                  <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
                  <li><strong>Chat History:</strong> Stored for 1 year unless deleted by users</li>
                  <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days</li>
                  <li><strong>Legal Obligations:</strong> Some data may be retained longer as required by law</li>
                  <li><strong>Safety Records:</strong> Records of violations may be retained for safety purposes</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. 
                These countries may have different data protection laws, but we ensure appropriate safeguards are in place 
                to protect your information in accordance with this privacy policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. Children's Privacy</h2>
              <p>
                SpeedHeart is not intended for users under 18 years of age. We do not knowingly collect personal 
                information from children under 18. If we become aware that we have collected personal information 
                from a child under 18, we will take steps to delete such information immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. For material changes, 
                we will provide additional notice such as an in-app notification.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="ml-4 mt-2">
                <p><strong>SpeedHeart Privacy Team</strong></p>
                <p>Email: privacy@speedheart.com</p>
                <p>Data Protection Officer: dpo@speedheart.com</p>
                
              </div>
            </section>

            <div className="mt-8 p-4 bg-muted/50 border rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                This Privacy Policy is designed to help you understand how we collect, use, and protect your information. 
                Your privacy is important to us, and we are committed to maintaining the confidentiality and security of your personal data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;