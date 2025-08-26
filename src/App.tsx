import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Heart } from 'lucide-react';
import ScrollToTop from './components/ScrollToTop';
import Chatbot from './components/Chatbot';
import Navbar from '@/components/Navbar';

// Lazy-load page components
const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Chat = lazy(() => import('./pages/Chat'));
const MessagesInbox = lazy(() => import('./pages/MessagesInbox'));
const ChatView = lazy(() => import('./pages/ChatView'));
const Settings = lazy(() => import('./pages/Settings'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const SafetyCenter = lazy(() => import('./pages/SafetyCenter'));
const Support = lazy(() => import('./pages/Support'));
const CSAEStandards = lazy(() => import('./pages/CSAEStandards'));
const Connections = lazy(() => import('./pages/Connections'));
const Communities = lazy(() => import('./pages/Communities'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const Date = lazy(() => import('./pages/Date'));
const Matches = lazy(() => import('./pages/Matches'));
const AccountDeletionRequest = lazy(() => import('./pages/AccountDeletionRequest'));
const BadgesPage = lazy(() => import('./pages/BadgesPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const UserVerification = lazy(() => import('./pages/UserVerification'));
const QuizPage = lazy(() => import('./pages/QuizPage').then(module => ({ default: module.default })));

import { initMLCEngine } from '@/utils/mlcEngine';

const queryClient = new QueryClient();

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error caught in boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">{this.state.error?.message || 'Unknown error'}</p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-white rounded"
              onClick={() => this.setState({ hasError: false })}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ element }) => {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('location,preferences,photos,age,gender')
            .eq('id', user.id)
            .maybeSingle();
          setUserId(user.id);
          if (!profile) {
            navigate('/onboarding');
          }
        } else {
          setUserId(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to verify user. Please sign in again.',
          variant: 'destructive',
        });
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [toast, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#D81B60]"></div>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/" replace />;
  }

  return React.cloneElement(element, { userId });
};

const NavigationHandler = ({ userId, showChatbot, setShowChatbot, children }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Define routes where chatbot trigger should be hidden
  const hideChatbotRoutes = [
    '/settings',
    '/support',
    '/csae-standards',
    '/quiz',
    '/verification'
  ];

  const shouldShowChatbotTrigger = !hideChatbotRoutes.some(route => location.pathname.startsWith(route));

  const handleQuizStart = () => navigate('/quiz');
  const handleCompatibilityTestStart = () => navigate('/date');
  const handleMatchesOrSpeedDating = () => navigate('/matches');
  const handleProfileUpdate = async (profile) => {
    try {
      const { error } = await supabase.from('users').update(profile).eq('id', userId);
      if (error) throw error;
      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully!' });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({ title: 'Update Failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
  };

  return (
    <>
      {children}
      {userId && shouldShowChatbotTrigger && (
        <>
          <Chatbot
            userId={userId}
            showChatbot={showChatbot}
            onToggle={() => setShowChatbot(!showChatbot)}
            onQuizStart={handleQuizStart}
            onCompatibilityTestStart={handleCompatibilityTestStart}
            onMatchesOrSpeedDating={handleMatchesOrSpeedDating}
            onProfileUpdate={handleProfileUpdate}
          />
          <button
            onClick={() => setShowChatbot(!showChatbot)}
            className="fixed bottom-16 right-4 z-[60] p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            aria-label="Toggle chatbot"
          >
            <Heart className="h-6 w-6" />
          </button>
        </>
      )}
    </>
  );
};

const NavbarHandler = () => {
  const location = useLocation();

  // Define routes where navbar should be hidden
  const hideNavbarRoutes = [
    '/quiz',
    '/messages/:chatId'
  ];

  const shouldShowNavbar = !hideNavbarRoutes.some(route => 
    route.includes(':') 
      ? location.pathname.match(new RegExp(`^${route.replace(/:\w+/, '[^/]+')}$`))
      : location.pathname.startsWith(route)
  );

  return shouldShowNavbar ? <Navbar /> : null;
};

const App = () => {
  const [userId, setUserId] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    initMLCEngine().catch((error) => console.error('MLC Engine init failed, falling back:', error));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'inherit' }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <ScrollToTop />
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#D81B60]"></div>
                    </div>
                  }
                >
                  <NavigationHandler userId={userId} showChatbot={showChatbot} setShowChatbot={setShowChatbot}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding setShowChatbot={setShowChatbot} />} />} />
                      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                      <Route path="/profile/:userId" element={<ProtectedRoute element={<UserProfile />} />} />
                      <Route path="/lobby" element={<ProtectedRoute element={<Lobby />} />} />
                      <Route path="/date" element={<ProtectedRoute element={<Date />} />} />
                      <Route path="/matches" element={<ProtectedRoute element={<Matches />} />} />
                      <Route path="/badges" element={<ProtectedRoute element={<BadgesPage />} />} />
                      <Route path="/connections" element={<ProtectedRoute element={<Connections />} />} />
                      <Route path="/communities" element={<ProtectedRoute element={<Communities />} />} />
                      <Route path="/communities/:id" element={<ProtectedRoute element={<CommunityDetail />} />} />
                      <Route path="/chat/:chatId" element={<ProtectedRoute element={<Chat />} />} />
                      <Route path="/messages" element={<ProtectedRoute element={<MessagesInbox />} />} />
                      <Route path="/messages/:chatId" element={<ProtectedRoute element={<ChatView />} />} />
                      <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/safety" element={<SafetyCenter />} />
                      <Route path="/csae-standards" element={<CSAEStandards />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/account-deletion-request" element={<ProtectedRoute element={<AccountDeletionRequest />} />} />
                      <Route path="/quiz" element={<ProtectedRoute element={<QuizPage />} />} />
                      <Route path="/verification" element={<ProtectedRoute element={<UserVerification currentStatus="unverified" onVerificationSubmitted={() => {}} />} />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </NavigationHandler>
                </Suspense>
                <NavbarHandler />
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;