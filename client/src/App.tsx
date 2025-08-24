import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { LoginPage } from "@/components/auth/login-page";
import { SignupPage } from "@/components/auth/signup-page";
import ChatPage from "@/pages/chat";
import ImageEditor from "@/pages/ImageEditor";
import VideoEditor from "@/pages/VideoEditor";
import DataAnalytics from "@/pages/DataAnalytics";
import GraphGenerator from "@/pages/GraphGenerator";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-xl font-semibold">Elora AI Loading...</div>
          <div className="text-gray-300 text-sm mt-2">Premium AI Assistant with Advanced Features</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-16 w-16 bg-purple-500 mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <div className="text-white text-xl font-semibold">Welcome to Elora AI</div>
          <div className="text-gray-300 text-sm mt-2">Preparing your premium AI experience...</div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Redirect to="/chat" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      </Route>
      
      <Route path="/signup">
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      </Route>

      {/* Protected routes */}
      <Route path="/chat">
        <ProtectedRoute>
          <ChatPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/image-editor">
        <ProtectedRoute>
          <ImageEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/video-editor">
        <ProtectedRoute>
          <VideoEditor />
        </ProtectedRoute>
      </Route>
      
      <Route path="/data-analytics">
        <ProtectedRoute>
          <DataAnalytics />
        </ProtectedRoute>
      </Route>
      
      <Route path="/graph-generator">
        <ProtectedRoute>
          <GraphGenerator />
        </ProtectedRoute>
      </Route>

      {/* Default redirect */}
      <Route path="/">
        <Redirect to="/chat" />
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="elora-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
