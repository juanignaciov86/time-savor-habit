
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "./utils/authUtils";
import Index from "./pages/Index";
import StatsPage from "./pages/StatsPage";
import HistoryPage from "./pages/HistoryPage";
import HabitsPage from "./pages/HabitsPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthed, setIsAuthed] = React.useState<boolean | null>(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const checkAuth = async () => {
      const authed = await isAuthenticated();
      setIsAuthed(authed);
    };

    // Check auth immediately
    checkAuth();

    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      checkAuth(); // Recheck auth when we go online
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show loading state only briefly when online
  if (isAuthed === null && isOnline) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  // When offline, if we're still loading, assume authenticated
  // This prevents flashing the login page when offline
  if (!isOnline && isAuthed === null) {
    return <>{children}</>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } />
              
              <Route path="/stats" element={
                <ProtectedRoute>
                  <StatsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/history" element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              } />
              
              <Route path="/habits" element={
                <ProtectedRoute>
                  <HabitsPage />
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
