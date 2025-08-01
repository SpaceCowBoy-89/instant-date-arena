
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Lobby from "./pages/Lobby";
import Chat from "./pages/Chat";
import MessagesInbox from "./pages/MessagesInbox";
import ChatView from "./pages/ChatView";
import Settings from "./pages/Settings";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SafetyCenter from "./pages/SafetyCenter";
import Support from "./pages/Support";
import CSAEStandards from "./pages/CSAEStandards";
import Connections from "./pages/Connections";
import { AccountDeletionRequest } from "./pages/AccountDeletionRequest";

import ScrollToTop from "./components/ScrollToTop";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <div style={{ minHeight: '100vh', backgroundColor: 'inherit' }}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<UserProfile />} />
              <Route path="/lobby" element={<Lobby />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/chat/:chatId" element={<Chat />} />
              <Route path="/messages" element={<MessagesInbox />} />
              <Route path="/messages/:chatId" element={<ChatView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/safety" element={<SafetyCenter />} />
              <Route path="/csae-standards" element={<CSAEStandards />} />
              <Route path="/support" element={<Support />} />
              <Route path="/account-deletion-request" element={<AccountDeletionRequest />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </div>
);

export default App;
