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
import Navbar from '@/components/Navbar';
import Spinner from '@/components/Spinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { SafeArea } from '@capacitor-community/safe-area';
import { Capacitor } from '@capacitor/core';
import '@/utils/initModeration'; // Initialize moderation service
import { logger } from '@/utils/logger';

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
const AccountDeletionRequest = lazy(() => import('./pages/AccountDeletionRequest'));
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


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

interface ProtectedRouteProps {
  element: React.ReactElement;
}

const ProtectedRoute = ({ element }: ProtectedRouteProps) => {
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
        logger.error('Error checking auth:', error);
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
  children: React.ReactNode;
}

const NavigationHandler = ({ userId, children }: NavigationHandlerProps) => {
  return (
    <>
      {children}
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    checkAuth();
  }, []);


  useEffect(() => {
    // Initialize SafeArea for native apps
    const initializeSafeArea = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await SafeArea.enable({
            config: {
              customColorsForSystemBars: true
            }
          });
          logger.info('SafeArea enabled successfully');
        } catch (error) {
          logger.error('Failed to enable SafeArea:', error);
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
                  <NavigationHandler userId={userId}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/onboarding" element={<ProtectedRoute element={<Onboarding userId={userId || ''} />} />} />
                      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                      <Route path="/profile/:userId" element={<ProtectedRoute element={<UserProfile />} />} />
                      <Route path="/lobby" element={<ProtectedRoute element={<Lobby />} />} />
                      <Route path="/date" element={<ProtectedRoute element={<Date />} />} />
                      <Route path="/matches" element={<ProtectedRoute element={<Matches />} />} />
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
                      <Route path="/quiz" element={<ProtectedRoute element={<QuizPage userId={userId || ''} />} />} />
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