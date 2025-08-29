import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home.tsx";
import CreateBook from "@/pages/create-book.tsx";
import FlipbookPreview from "@/pages/flipbook-preview.tsx";
import AuthPage from "@/pages/auth.tsx";
import Admin from "@/pages/admin.tsx";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/flipbook-preview" component={FlipbookPreview} />
      {isAuthenticated ? (
        <>
          <Route path="/" component={CreateBook} />
          <Route path="/create-book" component={CreateBook} />
          <Route path="/admin" component={Admin} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/create-book">
            {() => {
              window.location.href = "/auth";
              return null;
            }}
          </Route>
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
