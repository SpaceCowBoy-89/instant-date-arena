import React, { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Shield, Users, Settings, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters')
});
type ContactFormValues = z.infer<typeof contactFormSchema>;
const faqData = [{
  category: 'Getting Started',
  icon: <Users className="h-5 w-5" />,
  questions: [{
    question: 'What is SpeedHeart?',
    answer: 'SpeedHeart is a modern speed dating app that connects singles for quick, meaningful conversations. You join a queue, get matched with compatible users, and have a limited time to chat before deciding if you want to continue the conversation.'
  }, {
    question: 'How do I sign up?',
    answer: 'Simply create an account with your email and password on the home page. You\'ll need to complete your profile with photos and preferences before you can start matching.'
  }, {
    question: 'Is SpeedHeart free to use?',
    answer: 'Yes, SpeedHeart is completely free to use. You can join the queue, get matched, and chat without any cost.'
  }]
}, {
  category: 'Matching & Queue',
  icon: <Zap className="h-5 w-5" />,
  questions: [{
    question: 'How does the matching work?',
    answer: 'When you join the queue, our system matches you with other users based on your preferences (age range, location, interests). Both users must have compatible preferences to be matched.'
  }, {
    question: 'Why am I not getting matches?',
    answer: 'Make sure your profile is complete with photos and preferences set. If there aren\'t many users online in your area or age range, you might need to wait or adjust your preferences.'
  }, {
    question: 'How long do I stay in the queue?',
    answer: 'You stay in the queue until you get matched or manually leave. The system continuously looks for compatible matches.'
  }, {
    question: 'Can I leave the queue anytime?',
    answer: 'Yes, you can leave the queue at any time by clicking the \'Leave Queue\' button in the lobby.'
  }]
}, {
  category: 'Profile & Settings',
  icon: <Settings className="h-5 w-5" />,
  questions: [{
    question: 'What makes a good profile?',
    answer: 'Add clear, recent photos of yourself and fill out all sections including interests, bio, and preferences. A complete profile gets better matches.'
  }, {
    question: 'Can I change my preferences?',
    answer: 'Yes, you can update your age range, distance, and other preferences anytime in your profile settings.'
  }, {
    question: 'How do I add photos?',
    answer: 'Go to your profile page and click on the photo upload areas. You can add multiple photos to showcase your personality.'
  }, {
    question: 'Can I hide my profile?',
    answer: 'Currently, profiles are visible to other users when you\'re in the queue. You can leave the queue if you don\'t want to be discoverable.'
  }]
}, {
  category: 'Chatting & Messages',
  icon: <MessageSquare className="h-5 w-5" />,
  questions: [{
    question: 'How long do speed dating chats last?',
    answer: 'Initial speed dating sessions have a time limit to keep conversations flowing. After the session, you can continue chatting if both users are interested.'
  }, {
    question: 'What happens after a speed dating session?',
    answer: 'Both users can choose to continue the conversation. If both agree, you\'ll be able to chat freely in your messages.'
  }, {
    question: 'Can I report inappropriate behavior?',
    answer: 'Yes, you can report users for inappropriate behavior using the report button in chat or on their profile. We take safety seriously.'
  }, {
    question: 'How do I block someone?',
    answer: 'You can block users from their profile or during chat. Blocked users won\'t be able to contact you or see your profile.'
  }]
}, {
  category: 'Safety & Privacy',
  icon: <Shield className="h-5 w-5" />,
  questions: [{
    question: 'Is my personal information safe?',
    answer: 'Yes, we protect your personal information and only show what you choose to share in your profile. Your email and other private details are never shared.'
  }, {
    question: 'What should I do if someone makes me uncomfortable?',
    answer: 'Use the report and block features immediately. You can also visit our Safety Center for more resources and tips on safe online dating.'
  }, {
    question: 'Can I delete my account?',
    answer: 'Yes, you can delete your account anytime from the Settings page. This will permanently remove your profile and data.'
  }, {
    question: 'How do I change my password?',
    answer: 'Go to Settings and use the \'Change Password\' option to update your password securely.'
  }]
}, {
  category: 'Technical Support',
  icon: <Zap className="h-5 w-5" />,
  questions: [{
    question: 'The app isn\'t working properly. What should I do?',
    answer: 'Try refreshing the page or logging out and back in. If problems persist, check your internet connection or try using a different browser.'
  }, {
    question: 'I\'m not receiving notifications.',
    answer: 'Make sure notifications are enabled in your browser settings. Some browsers block notifications by default.'
  }, {
    question: 'I forgot my password. How do I reset it?',
    answer: 'Use the \'Forgot Password\' link on the login page to receive a password reset email.'
  }]
}];
export default function Support() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });
  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.functions.invoke('contact-support', {
        body: values
      });
      if (error) throw error;
      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon."
      });
      form.reset();
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Support Center</h1>
              <p className="text-muted-foreground">Get help and contact our support team</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* FAQ Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Find answers to common questions about SpeedHeart
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {faqData.map((category, categoryIndex) => <div key={category.category} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2 my-0 py-[5px]">
                        {category.icon}
                        {category.category}
                      </div>
                      {category.questions.map((faq, questionIndex) => <AccordionItem key={`${categoryIndex}-${questionIndex}`} value={`${categoryIndex}-${questionIndex}`} className="border rounded-lg px-4">
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>)}
                    </div>)}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for? Send us a message and we'll help you out.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="email" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="subject" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <FormControl>
                            <Input placeholder="What's this about?" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="message" render={({
                    field
                  }) => <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Please describe your issue or question in detail..." className="min-h-[120px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/safety">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Safety Center
                  </Button>
                </Link>
                <Link to="/privacy">
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Button>
                </Link>
                <Link to="/terms">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Terms of Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
}