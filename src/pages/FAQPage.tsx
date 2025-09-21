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
import faqsData from '@/data/faqs.json';

const categoryIcons = {
  'Getting Started': <Users className="h-5 w-5" />,
  'AI Quiz': <Zap className="h-5 w-5" />,
  'Compatibility Test': <Heart className="h-5 w-5" />,
  'Matching & Queue': <MessageSquare className="h-5 w-5" />,
  'Profile & Settings': <Settings className="h-5 w-5" />,
  'Chatting & Messages': <MessageSquare className="h-5 w-5" />,
  'Safety & Privacy': <Shield className="h-5 w-5" />,
  'App Features': <Zap className="h-5 w-5" />,
  'Technical Support': <Settings className="h-5 w-5" />,
  'Dating Success': <Heart className="h-5 w-5" />,
  'Badges': <Award className="h-5 w-5" />
};

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Load FAQ data from JSON with caching
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: async () => faqsData.map(category => ({
      ...category,
      icon: categoryIcons[category.category] || <Users className="h-5 w-5" />
    })),
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