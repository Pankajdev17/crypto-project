
import { QueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import { apiCache } from "./apiClient";

// Global error handler for API calls
const onQueryError = (error: Error) => {
  console.error('Query error:', error);
  
  // Don't show toast for network errors that are already handled
  if (error.message && error.message.includes('Failed to fetch')) {
    return;
  }
  
  toast({
    variant: "destructive",
    title: "Error",
    description: "Failed to fetch data. Using cached data if available.",
    duration: 5000,
  });
};

// Create a QueryClient instance with improved configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 15 * 1000, // 15 seconds by default
      gcTime: 5 * 60 * 1000, // 5 minutes cache
      refetchOnMount: "always", // Always refetch when component mounts
      refetchOnReconnect: true,
      meta: {
        onError: onQueryError
      }
    },
  },
});

// Function to invalidate all queries by pattern
export const invalidateQueriesByPattern = (pattern: string) => {
  // Invalidate both React Query cache and our API cache
  queryClient.invalidateQueries({ 
    predicate: (query) => {
      const queryKeyString = JSON.stringify(query.queryKey);
      return queryKeyString.includes(pattern);
    } 
  });
  
  // Also invalidate our API cache
  apiCache.invalidate(pattern);
};

// Function to invalidate all active queries
export const invalidateActiveQueries = () => {
  const activeQueries = queryClient.getQueryCache().findAll({ 
    predicate: (query) => query.getObserversCount() > 0 
  });
  
  activeQueries.forEach(query => {
    queryClient.invalidateQueries({ queryKey: query.queryKey });
  });
};
