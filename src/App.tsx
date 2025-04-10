
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { queryClient, invalidateActiveQueries } from "@/lib/queryClient";

const Index = lazy(() => import("./pages/Index"));
const Market = lazy(() => 
  import("./pages/Market")
    .catch(err => {
      console.error("Failed to load Market component:", err);
      return { default: () => <ErrorFallback pageName="Market" /> };
    })
);
const Portfolio = lazy(() => import("./pages/Portfolio"));
const CryptoDetails = lazy(() => import("./pages/CryptoDetails"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Simple error fallback for lazy-loaded routes
const ErrorFallback = ({ pageName }: { pageName: string }) => (
  <div className="flex flex-col h-screen w-full items-center justify-center p-4 text-center">
    <h2 className="text-2xl font-bold text-destructive mb-4">Failed to load {pageName} page</h2>
    <p className="mb-4">There was an error loading this page. Please try refreshing the browser.</p>
    <button 
      onClick={() => window.location.reload()} 
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
    >
      Refresh Page
    </button>
  </div>
);

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Route change listener that refreshes active queries
const RouteChangeListener = () => {
  useEffect(() => {
    // This effect will run on each route change
    const handleRouteChange = () => {
      // Invalidate all active queries on route change
      invalidateActiveQueries();
    };
    
    // Set up listener for route changes (using history API)
    window.addEventListener('popstate', handleRouteChange);
    
    // Also handle window focus events to refresh stale data
    const handleWindowFocus = () => {
      console.log('Window focused, checking for stale queries');
      const now = Date.now();
      
      // Find all active queries that are stale (older than 30 seconds)
      const staleQueries = queryClient.getQueryCache().findAll({
        predicate: (query) => {
          const state = query.state;
          return (
            query.getObserversCount() > 0 && 
            state.dataUpdatedAt > 0 && 
            now - state.dataUpdatedAt > 30 * 1000
          );
        }
      });
      
      // Only refetch stale queries that are currently active
      if (staleQueries.length > 0) {
        console.log(`Refreshing ${staleQueries.length} stale queries on window focus`);
        staleQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        });
      }
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);
  
  return null;
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteChangeListener />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/market" element={<Market />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/crypto/:coinId" element={<CryptoDetails key={window.location.pathname} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
