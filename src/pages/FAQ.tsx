import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const FAQ = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const faqSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      questions: [
        {
          question: "What is SpeedHeart?",
          answer: "SpeedHeart is a modern speed dating app that connects singles for quick, meaningful conversations. You join a queue, get matched with compatible users, and have a limited time to chat before deciding if you want to continue the conversation."
        },
        {
          question: "How do I sign up?",
          answer: "Simply create an account with your email and password on the home page. You'll need to complete your profile with photos and preferences before you can start matching."
        },
        {
          question: "Is SpeedHeart free to use?",
          answer: "Yes, SpeedHeart is completely free to use. You can join the queue, get matched, and chat without any cost."
        }
      ]
    },
    {
      id: "matching",
      title: "Matching & Queue",
      questions: [
        {
          question: "How does the matching work?",
          answer: "When you join the queue, our system matches you with other users based on your preferences (age range, location, interests). Both users must have compatible preferences to be matched."
        },
        {
          question: "Why am I not getting matches?",
          answer: "Make sure your profile is complete with photos and preferences set. If there aren't many users online in your area or age range, you might need to wait or adjust your preferences."
        },
        {
          question: "How long do I stay in the queue?",
          answer: "You stay in the queue until you get matched or manually leave. The system continuously looks for compatible matches."
        },
        {
          question: "Can I leave the queue anytime?",
          answer: "Yes, you can leave the queue at any time by clicking the 'Leave Queue' button in the lobby."
        }
      ]
    },
    {
      id: "profile",
      title: "Profile & Settings",
      questions: [
        {
          question: "What makes a good profile?",
          answer: "Add clear, recent photos of yourself and fill out all sections including interests, bio, and preferences. A complete profile gets better matches."
        },
        {
          question: "Can I change my preferences?",
          answer: "Yes, you can update your age range, distance, and other preferences anytime in your profile settings."
        },
        {
          question: "How do I add photos?",
          answer: "Go to your profile page and click on the photo upload areas. You can add multiple photos to showcase your personality."
        },
        {
          question: "Can I hide my profile?",
          answer: "Currently, profiles are visible to other users when you're in the queue. You can leave the queue if you don't want to be discoverable."
        }
      ]
    },
    {
      id: "chatting",
      title: "Chatting & Messages",
      questions: [
        {
          question: "How long do speed dating chats last?",
          answer: "Initial speed dating sessions have a time limit to keep conversations flowing. After the session, you can continue chatting if both users are interested."
        },
        {
          question: "What happens after a speed dating session?",
          answer: "Both users can choose to continue the conversation. If both agree, you'll be able to chat freely in your messages."
        },
        {
          question: "Can I report inappropriate behavior?",
          answer: "Yes, you can report users for inappropriate behavior using the report button in chat or on their profile. We take safety seriously."
        },
        {
          question: "How do I block someone?",
          answer: "You can block users from their profile or during chat. Blocked users won't be able to contact you or see your profile."
        }
      ]
    },
    {
      id: "safety",
      title: "Safety & Privacy",
      questions: [
        {
          question: "Is my personal information safe?",
          answer: "Yes, we protect your personal information and only show what you choose to share in your profile. Your email and other private details are never shared."
        },
        {
          question: "What should I do if someone makes me uncomfortable?",
          answer: "Use the report and block features immediately. You can also visit our Safety Center for more resources and tips on safe online dating."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can delete your account anytime from the Settings page. This will permanently remove your profile and data."
        },
        {
          question: "How do I change my password?",
          answer: "Go to Settings and use the 'Change Password' option to update your password securely."
        }
      ]
    },
    {
      id: "technical",
      title: "Technical Support",
      questions: [
        {
          question: "The app isn't working properly. What should I do?",
          answer: "Try refreshing the page or logging out and back in. If problems persist, check your internet connection or try using a different browser."
        },
        {
          question: "I'm not receiving notifications.",
          answer: "Make sure notifications are enabled in your browser settings. Some browsers block notifications by default."
        },
        {
          question: "Can I use SpeedHeart on mobile?",
          answer: "Yes, SpeedHeart works on mobile browsers. For the best experience, use a modern browser like Chrome or Safari."
        },
        {
          question: "I forgot my password. How do I reset it?",
          answer: "Use the 'Forgot Password' link on the login page to receive a password reset email."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mt-2">
              Find answers to common questions about using SpeedHeart
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {faqSections.map((section) => (
            <Card key={section.id} className="border border-border">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">{section.title}</CardTitle>
                <CardDescription>
                  {section.id === "getting-started" && "Learn the basics of using SpeedHeart"}
                  {section.id === "matching" && "Understand how matching and queues work"}
                  {section.id === "profile" && "Tips for creating and managing your profile"}
                  {section.id === "chatting" && "Everything about messaging and conversations"}
                  {section.id === "safety" && "Stay safe while using the platform"}
                  {section.id === "technical" && "Troubleshoot common technical issues"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.questions.map((faq, index) => (
                  <Collapsible
                    key={index}
                    open={openSections[`${section.id}-${index}`]}
                    onOpenChange={() => toggleSection(`${section.id}-${index}`)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between text-left p-4 hover:bg-accent/50 border border-border rounded-lg"
                      >
                        <span className="font-medium text-foreground">{faq.question}</span>
                        {openSections[`${section.id}-${index}`] ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 border border-border">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Still have questions?</CardTitle>
            <CardDescription>
              If you couldn't find the answer you were looking for, here are some additional resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/safety")}
                className="flex items-center gap-2"
              >
                Safety Center
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/privacy")}
                className="flex items-center gap-2"
              >
                Privacy Policy
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/terms")}
                className="flex items-center gap-2"
              >
                Terms of Service
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              For additional support, please refer to these resources or check our safety guidelines.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;