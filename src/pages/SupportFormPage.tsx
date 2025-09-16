import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Shield, Settings } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Spinner from '@/components/Spinner';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters')
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function SupportFormPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: ''
    }
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500); // Mock delay
  }, []);

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('contact-support', {
        body: values
      });
      if (error) throw error;
      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon."
      });
      form.reset();
      navigate('/support/thank-you');
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

  if (loading || isSubmitting) {
    return <Spinner size="sm:h-12 sm:w-12 h-10 w-10" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft className="h-6 w-6 text-gray-900 dark:text-gray-100" />
          </Button>
          <h1 className="text-2xl font-bold">Contact Support</h1>
          <p className="text-muted-foreground">Send us a message, and our team will get back to you soon.</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input placeholder="your.email@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="What's this about?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Please describe your issue or question in detail..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <div className="text-sm text-muted-foreground">
                      {form.watch('message').length < 20 && `${form.watch('message').length}/20 characters`}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Spinner size="h-8 w-8" isButtonSpinner />
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </form>
            </Form>
            <div className="text-center mt-6">
              <p className="text-muted-foreground">Prefer another way to reach us?</p>
              <a href="mailto:support@speedheart.com" className="text-primary hover:underline">
                Email us at support@speedheart.com
              </a>
            </div>
          </CardContent>
        </Card>
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/safety"><Button variant="outline" className="w-full justify-start"><Shield className="h-4 w-4 mr-2 text-primary" /> Safety Center</Button></Link>
            <Link to="/privacy"><Button variant="outline" className="w-full justify-start"><Shield className="h-4 w-4 mr-2 text-primary" /> Privacy Policy</Button></Link>
            <Link to="/terms"><Button variant="outline" className="w-full justify-start"><Settings className="h-4 w-4 mr-2 text-primary" /> Terms of Service</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}