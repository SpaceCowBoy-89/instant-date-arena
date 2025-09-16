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
import Spinner from '@/components/Spinner';
import { SafeArea } from '@capacitor-community/safe-area';
import { Capacitor } from '@capacitor/core';

const Index = lazy(() => import('./pages/Index'));
const Profile = lazy(() => import('./pages/Profile'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const Lobby = lazy(() => import('./pages/Lobby'));
const Chat = lazy(() => import('./pages/Chat'));
const MessagesInbox = lazy(() => import('./pages/MessagesInbox'));
const ChatView = lazy(() => import('./pages/ChatView'));
const Settings = lazy(() => import('./pages/Settings'));
const Notifications = lazy(() => import('./pages/Notifications'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const SafetyCenter = lazy(() => import('./pages/SafetyCenter'));
const Support = lazy(() => import('./pages/Support'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const SupportFormPage = lazy(() => import('./pages/SupportFormPage'));
const CSAEStandards = lazy(() => import('./pages/CSAEStandards'));
const Connections = lazy(() => import('./pages/Connections'));
const Communities = lazy(() => import('./pages/Communities'));
const AllGroups = lazy(() => import('./pages/AllGroups'));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail'));
const Date = lazy(() => import('./pages/Date'));
const Matches = lazy(() => import('./pages/Matches'));
const AccountDeletionRequest = lazy(() => import('./pages/AccountDeletionRequest').then(module => ({ default: module.default })));
const BadgesPage = lazy(() => import('./pages/BadgesPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const UserVerification = lazy(() => import('./pages/UserVerification'));
const QuizPage = lazy(() => import('./pages/QuizPage').then(module => ({ default: module.default })));
const Visibility = lazy(() => import('./pages/Visibility'));
const Share = lazy(() => import('./pages/Share'));
const SpeedSparkArena = lazy(() => import('./pages/SpeedSparkArena'));
const SpeedRallyArena = lazy(() => import('./pages/SpeedRallyArena'));
const SpeedClashArena = lazy(() => import('./pages/SpeedClashArena'));
const SpeedPulseArena = lazy(() => import('./pages/SpeedPulseArena'));
const SpeedBurstArena = lazy(() => import('./pages/SpeedBurstArena'));

import { initMLCEngine } from '@/utils/mlcEngine';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});


interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
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

const ProtectedRoute = ({ element }: { element: React.ReactElement }) => {
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
    return <Spinner size="sm:h-12 sm:w-12 h-10 w-10" />;
  }

  return userId ? element : <Navigate to="/" replace />;
};

interface NavigationHandlerProps {
  userId: string | null;
  showChatbot: boolean;
  setShowChatbot: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}

const NavigationHandler = ({ userId, showChatbot, setShowChatbot, children }: NavigationHandlerProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const hideChatbotRoutes = [
    '/settings',
    '/notifications',
    '/quiz',
    '/messages/:chatId',
    '/visibility',
    '/terms',
    '/privacy',
    '/share',
    '/verification',
    '/safety',
    '/support',
    '/faq',
    '/matches',
    '/arena/speed-spark',
    '/arena/speed-clash',
    '/arena/speed-pulse',
    '/arena/speed-burst',
    '/arena/speed-rally'
  ];

  const shouldShowChatbot = !hideChatbotRoutes.some(route =>
    route.includes(':')
      ? location.pathname.match(new RegExp(`^${route.replace(/:\w+/, '[^/]+')}$`))
      : location.pathname.startsWith(route)
  );

  return (
    <>
      {children}
      {shouldShowChatbot && userId && (
        <>
          <Chatbot
            userId={userId}
            showChatbot={showChatbot}
            onToggle={() => setShowChatbot(!showChatbot)}
            onQuizStart={() => navigate('/quiz?returnTo=/communities')}
            onCompatibilityTestStart={() => navigate('/date')}
            onMatchesOrSpeedDating={() => navigate('/matches')}
            onProfileUpdate={async (profile) => {
              try {
                await supabase.from('users').update(profile).eq('id', userId);
              } catch (error) {
                console.error('Error updating profile:', error);
              }
            }}
          />
          {!showChatbot && (
            <button
              onClick={() => setShowChatbot(!showChatbot)}
              className="chatbot-trigger fixed bottom-16 right-4 z-[60] p-3 bg-gradient-to-r from-[hsl(var(--purple-accent))] to-[hsl(var(--romance))] text-[hsl(var(--primary-foreground))] rounded-full shadow-[hsl(var(--glow-shadow))] hover:from-[hsl(var(--purple-accent-dark))] hover:to-[hsl(var(--romance-dark))] transition-all duration-300"
              aria-label="Toggle chatbot"
            >
              <Heart className="h-6 w-6" />
            </button>
          )}
        </>
      )}
    </>
  );
};

const NavbarHandler = () => {
  const location = useLocation();

  const hideNavbarRoutes = ['/quiz', '/messages/:chatId'];

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

  useEffect(() => {
    // Initialize SafeArea for native apps
    const initializeSafeArea = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await SafeArea.enable();
          console.log('SafeArea enabled successfully');
        } catch (error) {
          console.error('Failed to enable SafeArea:', error);
        }
      }
    };

    initializeSafeArea();
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
                <Suspense fallback={<Spinner size="sm:h-12 sm:w-12 h-10 w-10" />}>
                  <NavigationHandler userId={userId} showChatbot={showChatbot} setShowChatbot={setShowChatbot}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding userId={userId || ''} setShowChatbot={setShowChatbot} />} />} />
                      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                      <Route path="/profile/:userId" element={<ProtectedRoute element={<UserProfile userId={userId || ''} />} />} />
                      <Route path="/lobby" element={<ProtectedRoute element={<Lobby />} />} />
                      <Route path="/date" element={<ProtectedRoute element={<Date />} />} />
                      <Route path="/matches" element={<ProtectedRoute element={<Matches setShowChatbot={setShowChatbot} />} />} />
                      <Route path="/badges" element={<ProtectedRoute element={<BadgesPage userId={userId || ''} onQuizStart={() => {}} onMatchesOrSpeedDating={() => {}} />} />} />
                      <Route path="/connections" element={<ProtectedRoute element={<Connections />} />} />
                      <Route path="/communities" element={<ProtectedRoute element={<Communities />} />} />
                      <Route path="/communities/all" element={<ProtectedRoute element={<AllGroups />} />} />
                      <Route path="/communities/:id" element={<ProtectedRoute element={<CommunityDetail />} />} />
                      <Route path="/chat/:chatId" element={<ProtectedRoute element={<Chat />} />} />
                      <Route path="/messages" element={<ProtectedRoute element={<MessagesInbox />} />} />
                      <Route path="/messages/:chatId" element={<ProtectedRoute element={<ChatView />} />} />
                      <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
                      <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/safety" element={<SafetyCenter />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/support/faq" element={<FAQPage />} />
                      <Route path="/support/contact" element={<SupportFormPage />} />
                      <Route path="/csae-standards" element={<CSAEStandards />} />
                      <Route path="/account-deletion-request" element={<ProtectedRoute element={<AccountDeletionRequest />} />} />
                      <Route path="/quiz" element={<ProtectedRoute element={<QuizPage />} />} />
                      <Route path="/verification" element={<ProtectedRoute element={<UserVerification currentStatus="unverified" onVerificationSubmitted={() => {}} />} />} />
                      <Route path="/visibility" element={<ProtectedRoute element={<Visibility />} />} />
                      <Route path="/share" element={<Share />} />
                      <Route path="/arena/speed-spark" element={<ProtectedRoute element={<SpeedSparkArena />} />} />
                      <Route path="/arena/speed-rally" element={<ProtectedRoute element={<SpeedRallyArena />} />} />
                      <Route path="/arena/speed-clash" element={<ProtectedRoute element={<SpeedClashArena />} />} />
                      <Route path="/arena/speed-pulse" element={<ProtectedRoute element={<SpeedPulseArena />} />} />
                      <Route path="/arena/speed-burst" element={<ProtectedRoute element={<SpeedBurstArena />} />} />
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