import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Users, Zap, Settings, Shield, Heart, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import Spinner from '@/components/Spinner';
import { Capacitor } from '@capacitor/core';

const faqData = [
  {
    category: 'Getting Started',
    icon: <Users className="h-5 w-5" />,
    questions: [
      {
        question: 'What is SpeedHeart?',
        answer: 'SpeedHeart is a modern speed dating app that connects singles for quick, meaningful conversations. You join a queue, get matched with compatible users, and have a limited time to chat before deciding if you want to continue the conversation.'
      },
      {
        question: 'How do I sign up?',
        answer: 'Simply create an account with your email and password on the home page. You\'ll need to complete your profile with photos and preferences before you can start matching.'
      },
      {
        question: 'Is SpeedHeart free to use?',
        answer: 'Yes, SpeedHeart is completely free to use. You can join the queue, get matched, and chat without any cost.'
      }
    ]
  },
  {
    category: 'Matching & Queue',
    icon: <Zap className="h-5 w-5" />,
    questions: [
      {
        question: 'How does the matching work?',
        answer: 'When you join the queue, our system matches you with other users based on your preferences (age range, location, interests). Both users must have compatible preferences to be matched.'
      },
      {
        question: 'Why am I not getting matches?',
        answer: 'Make sure your profile is complete with photos and preferences set. If there aren\'t many users online in your area or age range, you might need to wait or adjust your preferences.'
      },
      {
        question: 'How long do I stay in the queue?',
        answer: 'You stay in the queue until you get matched or manually leave. The system continuously looks for compatible matches.'
      },
      {
        question: 'Can I leave the queue anytime?',
        answer: 'Yes, you can leave the queue at any time by clicking the \'Leave Queue\' button in the lobby.'
      }
    ]
  },
  {
    category: 'Profile & Settings',
    icon: <Settings className="h-5 w-5" />,
    questions: [
      {
        question: 'What makes a good profile?',
        answer: 'Add clear, recent photos of yourself and fill out all sections including interests, bio, and preferences. A complete profile gets better matches.'
      },
      {
        question: 'Can I change my preferences?',
        answer: 'Yes, you can update your age range, distance, and other preferences anytime in your profile settings.'
      },
      {
        question: 'How do I add photos?',
        answer: 'Go to your profile page and click on the photo upload areas. You can add multiple photos to showcase your personality.'
      },
      {
        question: 'Can I hide my profile?',
        answer: 'Currently, profiles are visible to other users when you\'re in the queue. You can leave the queue if you don\'t want to be discoverable.'
      }
    ]
  },
  {
    category: 'Chatting & Messages',
    icon: <MessageSquare className="h-5 w-5" />,
    questions: [
      {
        question: 'How long do speed dating chats last?',
        answer: 'Initial speed dating sessions have a time limit to keep conversations flowing. After the session, you can continue chatting if both users are interested.'
      },
      {
        question: 'What happens after a speed dating session?',
        answer: 'Both users can choose to continue the conversation. If both agree, you\'ll be able to chat freely in your messages.'
      },
      {
        question: 'Can I report inappropriate behavior?',
        answer: 'Yes, you can report users for inappropriate behavior using the report button in chat or on their profile. We take safety seriously.'
      },
      {
        question: 'How do I block someone?',
        answer: 'You can block users from their profile or during chat. Blocked users won\'t be able to contact you or see your profile.'
      }
    ]
  },
  {
    category: 'Safety & Privacy',
    icon: <Shield className="h-5 w-5" />,
    questions: [
      {
        question: 'Is my personal information safe?',
        answer: 'Yes, we protect your personal information and only show what you choose to share in your profile. Your email and other private details are never shared.'
      },
      {
        question: 'What should I do if someone makes me uncomfortable?',
        answer: 'Use the report and block features immediately. You can also visit our Safety Center for more resources and tips on safe online dating.'
      },
      {
        question: 'Can I delete my account?',
        answer: 'Yes, you can delete your account anytime from the Settings page. This will permanently remove your profile and data.'
      },
      {
        question: 'How do I change my password?',
        answer: 'Go to Settings and use the \'Change Password\' option to update your password securely.'
      }
    ]
  },
  {
    category: 'Badges & Rewards',
    icon: <Award className="h-5 w-5" />,
    questions: [
      {
        question: 'What are badges and how do I earn them?',
        answer: 'Badges are achievements you earn by completing activities like taking the AI Quiz, chatting with matches, and joining communities. Each badge comes with special rewards.'
      },
      {
        question: 'What rewards do badges give me?',
        answer: 'Badges unlock various rewards like exclusive quiz insights, priority in speed dating queues, access to premium community events, and profile boosts.'
      },
      {
        question: 'How can I see my badges?',
        answer: 'Visit the Badges page from your profile to see all available badges, your progress, and which ones you\'ve earned. You can also share your badges on social media.'
      },
      {
        question: 'Can I share my badges?',
        answer: 'Yes! Once you earn a badge, you can share it on social media to show off your achievements and attract more potential matches.'
      }
    ]
  },
  {
    category: 'Verification',
    icon: <Shield className="h-5 w-5" />,
    questions: [
      {
        question: 'Why should I verify my account?',
        answer: 'Verification helps create a safer community and builds trust with other users. Verified users get access to all features and are more likely to get quality matches.'
      },
      {
        question: 'What verification methods are available?',
        answer: 'You can verify through phone number (SMS OTP), email address (magic link), advanced AI face verification (MediaPipe), or social media accounts like Twitter/X.'
      },
      {
        question: 'Is my verification information safe?',
        answer: 'Yes, all verification information is encrypted and stored securely. We never share your personal details with other users.'
      }
    ]
  },
  {
    category: 'Technical Support',
    icon: <Zap className="h-5 w-5" />,
    questions: [
      {
        question: 'The app isn\'t working properly. What should I do?',
        answer: 'Try refreshing the page or logging out and back in. If problems persist, check your internet connection or try using a different browser.'
      },
      {
        question: 'I\'m not receiving notifications.',
        answer: 'Make sure notifications are enabled in your browser settings. Some browsers block notifications by default.'
      },
      {
        question: 'I forgot my password. How do I reset it?',
        answer: 'Use the \'Forgot Password\' link on the login page to receive a password reset email.'
      },
      {
        question: 'Does SpeedHeart work on mobile devices?',
        answer: 'Yes! SpeedHeart is optimized for mobile devices and works great on smartphones and tablets. You can also install it as a PWA (Progressive Web App) for a native app experience.'
      }
    ]
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Mock data fetching with caching
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => faqData, // Replace with Supabase query if needed
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  if (isLoading) {
    return <Spinner size="sm:h-12 sm:w-12 h-10 w-10" />;
  }

  const filteredFAQs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background mobile-container">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-background/80 backdrop-blur-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 shrink-0"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-foreground truncate">FAQs</h1>
          <p className="text-muted-foreground text-sm">Find answers to common questions</p>
        </div>
      </div>

      <div className="p-4" style={{ paddingBottom: '8rem' }}>
        {/* Search Input */}
        <div className="mb-6">
          <Input
            placeholder="Search FAQs..."
            className="h-12"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6 max-w-4xl mx-auto">
          {filteredFAQs.map((category, categoryIndex) => (
            <Card key={category.category} className="bg-[hsl(var(--card))/0.5] dark:bg-[hsl(var(--card))/0.5] backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {React.cloneElement(category.icon, { className: 'h-5 w-5 text-[hsl(var(--romance))]' })}
                  <span className="text-lg">{category.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((faq, questionIndex) => (
                    <AccordionItem
                      key={`${categoryIndex}-${questionIndex}`}
                      value={`${categoryIndex}-${questionIndex}`}
                      className="border border-[hsl(var(--border))] rounded-lg px-4 hover:border-[hsl(var(--romance))/0.3] transition-colors"
                    >
                      <AccordionTrigger className="hover:bg-[hsl(var(--romance))/0.05] text-left py-4 font-medium">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-[hsl(var(--muted-foreground))] leading-relaxed pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-[hsl(var(--romance))/0.1] to-[hsl(var(--purple-accent))/0.1] border-[hsl(var(--romance))/0.3]">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Still need help?</h3>
              <p className="text-[hsl(var(--muted-foreground))] mb-4 text-sm">
                Our support team is here to help you with any questions or issues.
              </p>
              <Link to="/support/contact">
                <Button className="bg-gradient-to-r from-[hsl(var(--romance))] to-[hsl(var(--purple-accent))] hover:from-[hsl(var(--romance-dark))] hover:to-[hsl(var(--purple-accent))] text-[hsl(var(--primary-foreground))] shadow-[hsl(var(--glow-shadow))] transition-all duration-300">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}