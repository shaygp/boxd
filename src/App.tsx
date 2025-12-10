import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const Landing = lazy(() => import("./pages/Landing"));
const Index = lazy(() => import("./pages/Index"));
const Profile = lazy(() => import("./pages/Profile"));
const Diary = lazy(() => import("./pages/Diary"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Lists = lazy(() => import("./pages/Lists"));
const ListDetail = lazy(() => import("./pages/ListDetail"));
const Explore = lazy(() => import("./pages/Explore"));
const RaceDetail = lazy(() => import("./pages/RaceDetail"));
const Search = lazy(() => import("./pages/Search"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Test = lazy(() => import("./pages/Test"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Settings = lazy(() => import("./pages/Settings"));
const Support = lazy(() => import("./pages/Support"));
const SeedData = lazy(() => import("./pages/SeedData"));
const FormulaWrapped = lazy(() => import("./pages/FormulaWrapped").then(m => ({ default: m.FormulaWrapped })));
const LiveChatPage = lazy(() => import("./pages/LiveChatPage"));
const DeleteActivity = lazy(() => import("./pages/DeleteActivity"));

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
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black">
              <div className="text-white">Loading...</div>
            </div>
          }>
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
              <Route path="/delete-activity" element={<ProtectedRoute><DeleteActivity /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
