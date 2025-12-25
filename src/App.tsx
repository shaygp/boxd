import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ScrollRestoration } from "./components/ScrollRestoration";
import { SwipeBack } from "./components/SwipeBack";

// Import main pages directly (no lazy loading for frequently used pages)
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Diary from "./pages/Diary";
import Watchlist from "./pages/Watchlist";
import Lists from "./pages/Lists";
import Search from "./pages/Search";
import RaceDetail from "./pages/RaceDetail";
import ListDetail from "./pages/ListDetail";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Test from "./pages/Test";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Settings from "./pages/Settings";
import Support from "./pages/Support";
import SeedData from "./pages/SeedData";
import { FormulaWrapped } from "./pages/FormulaWrapped";
import { GrillTheGrid } from "./pages/GrillTheGrid";
import { GrillLeaderboardPage } from "./pages/GrillLeaderboard";
import LiveChatPage from "./pages/LiveChatPage";
import DeleteActivity from "./pages/DeleteActivity";
import { SecretSanta } from "./pages/SecretSanta";
import { SecretSantaSubmit } from "./pages/SecretSantaSubmit";
import { SecretSantaGiftSent } from "./pages/SecretSantaGiftSent";
import { SecretSantaGiftView } from "./pages/SecretSantaGiftView";
import { SecretSantaGallery } from "./pages/SecretSantaGallery";
import { SecretSantaLeaderboard } from "./pages/SecretSantaLeaderboard";
import { SecretSantaOGImage } from "./pages/SecretSantaOGImage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (user) {
    return <Navigate to="/home" />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollRestoration />
          <SwipeBack />
          <Routes>
              <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/test" element={<Test />} />
              <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/user/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/diary" element={<ProtectedRoute><Diary /></ProtectedRoute>} />
              <Route path="/watchlist" element={<ProtectedRoute><Watchlist /></ProtectedRoute>} />
              <Route path="/lists" element={<ProtectedRoute><Lists /></ProtectedRoute>} />
              <Route path="/list/:listId" element={<ProtectedRoute><ListDetail /></ProtectedRoute>} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/race/:id" element={<ProtectedRoute><RaceDetail /></ProtectedRoute>} />
              <Route path="/race/:season/:round" element={<ProtectedRoute><RaceDetail /></ProtectedRoute>} />
              <Route path="/live-chat/:year/:round" element={<ProtectedRoute><LiveChatPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/support" element={<Support />} />
              <Route path="/seed-data" element={<ProtectedRoute><SeedData /></ProtectedRoute>} />
              <Route path="/wrapped" element={<ProtectedRoute><FormulaWrapped /></ProtectedRoute>} />
              <Route path="/grill-the-grid" element={<ProtectedRoute><GrillTheGrid /></ProtectedRoute>} />
              <Route path="/grill-leaderboard" element={<ProtectedRoute><GrillLeaderboardPage /></ProtectedRoute>} />
              <Route path="/delete-activity" element={<ProtectedRoute><DeleteActivity /></ProtectedRoute>} />
              <Route path="/secret-santa" element={<ProtectedRoute><SecretSanta /></ProtectedRoute>} />
              <Route path="/secret-santa/submit" element={<ProtectedRoute><SecretSantaSubmit /></ProtectedRoute>} />
              <Route path="/secret-santa/gift-sent" element={<ProtectedRoute><SecretSantaGiftSent /></ProtectedRoute>} />
              <Route path="/secret-santa/my-gift" element={<ProtectedRoute><SecretSantaGiftSent /></ProtectedRoute>} />
              <Route path="/secret-santa/gift/:id" element={<SecretSantaGiftView />} />
              <Route path="/secret-santa/og-image/:id" element={<SecretSantaOGImage />} />
              <Route path="/secret-santa/gallery" element={<ProtectedRoute><SecretSantaGallery /></ProtectedRoute>} />
              <Route path="/secret-santa/leaderboard" element={<ProtectedRoute><SecretSantaLeaderboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
