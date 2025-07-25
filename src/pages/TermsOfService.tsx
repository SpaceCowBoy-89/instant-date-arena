import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pt-safe">
        <div className="flex items-center justify-between p-4" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">Terms of Service</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-24 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">SpeedHeart Terms of Service</CardTitle>
            <p className="text-muted-foreground text-center">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using SpeedHeart ("the App"), you accept and agree to be bound by the terms and 
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">2. App Functionality</h2>
              <p>
                SpeedHeart is a dating and social connection platform that facilitates brief, time-limited text 
                conversations between users. The app matches users for short-duration interactions designed to 
                help people connect and potentially form meaningful relationships.
              </p>
              <div className="ml-4 mt-2">
                <p><strong>Key Features:</strong></p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Time-limited matching system with daily limits</li>
                  <li>Text chat capabilities</li>
                  <li>User profiles with interests and preferences</li>
                  <li>Geographic matching preferences</li>
                  <li>Privacy-focused interaction environment</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">3. User Eligibility and Account Requirements</h2>
              <p>
                You must be at least 18 years old to use SpeedHeart. By creating an account, you represent and warrant that:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>You are at least 18 years of age</li>
                <li>You have the legal capacity to enter into this agreement</li>
                <li>All information you provide is accurate and truthful</li>
                <li>You will maintain the accuracy of such information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">4. Content Restrictions and Prohibited Conduct</h2>
              <p><strong>You agree NOT to use SpeedHeart to:</strong></p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Share, post, or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or racially offensive</li>
                <li>Engage in any form of harassment, stalking, or intimidation</li>
                <li>Share explicit sexual content, nudity, or sexually suggestive material</li>
                <li>Promote violence, hate speech, or discrimination of any kind</li>
                <li>Solicit money, goods, or services from other users</li>
                <li>Share personal contact information (phone numbers, addresses, social media handles) until mutual consent</li>
                <li>Use the platform for commercial purposes or advertising</li>
                <li>Create fake profiles or misrepresent your identity</li>
                <li>Attempt to circumvent any technical limitations or security measures</li>
                <li>Share content that infringes on intellectual property rights</li>
              </ul>
              
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="font-semibold text-destructive">Content Monitoring:</p>
                <p>
                  SpeedHeart employs automated systems and human moderation to detect and prevent the generation or 
                  sharing of restricted content. Violations may result in immediate suspension or permanent ban.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">5. Intellectual Property Rights</h2>
              <p>
                The SpeedHeart app, including its original content, features, and functionality, is owned by SpeedHeart 
                and is protected by international copyright, trademark, patent, trade secret, and other intellectual 
                property laws.
              </p>
              <div className="ml-4 mt-2">
                <p><strong>User Content:</strong></p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>You retain ownership of content you create and share</li>
                  <li>By sharing content, you grant SpeedHeart a non-exclusive license to use, modify, and display such content for platform operations</li>
                  <li>You represent that you own or have permission to share all content you upload</li>
                  <li>SpeedHeart reserves the right to remove any content that violates these terms</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">6. Privacy and Data Protection</h2>
              <p>
                Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the 
                Service, to understand our practices regarding the collection, use, and disclosure of your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">7. Safety and Security</h2>
              <p>
                While SpeedHeart implements various safety measures, users are responsible for their own safety when 
                interacting with others. We recommend:
              </p>
              <ul className="list-disc ml-6 space-y-1">
                <li>Never sharing personal information (address, financial details) with strangers</li>
                <li>Meeting in public places if you choose to meet in person</li>
                <li>Reporting suspicious or inappropriate behavior immediately</li>
                <li>Trusting your instincts and ending conversations that make you uncomfortable</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">8. Limitation of Liability</h2>
              <p>
                SpeedHeart shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting 
                from your access to or use of or inability to access or use the service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">9. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice 
                or liability, under our sole discretion, for any reason whatsoever, including without limitation if you 
                breach the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">10. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will 
                provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">11. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="ml-4 mt-2">
                <p><strong>SpeedHeart Support</strong></p>
                <p>Email: support@speedheart.com</p>
                <p>Legal: legal@speedheart.com</p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;