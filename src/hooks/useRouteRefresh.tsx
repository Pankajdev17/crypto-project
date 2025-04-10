
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

/**
 * A custom hook that refreshes query data when the route changes or component mounts
 * @param queryKey The query key to invalidate
 * @param options Configuration options
 */
interface UseRouteRefreshOptions {
  enabled?: boolean;
  onlyInvalidate?: boolean;
  refetchInterval?: number | false;
  onRouteChange?: boolean;
  refetchOnFocus?: boolean;
  staleTime?: number;
}

export function useRouteRefresh(
  queryKey: unknown[],
  options: UseRouteRefreshOptions = {}
) {
  const {
    enabled = true,
    onlyInvalidate = false,
    refetchInterval = false,
    onRouteChange = true,
    refetchOnFocus = true,
    staleTime = 15 * 1000 // 15 seconds default
  } = options;

  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Track if component is mounted (for focus handling)
  const isMounted = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    isMounted.current = true;

    // Function to refresh data
    const refreshData = () => {
      if (onlyInvalidate) {
        queryClient.invalidateQueries({ queryKey });
      } else {
        // Invalidate and refetch immediately
        queryClient.invalidateQueries({ 
          queryKey, 
          refetchType: 'all',
          exact: false
        });
      }
    };

    // Refresh on mount/route change
    refreshData();

    // Set up interval if specified
    let intervalId: number | undefined;
    if (refetchInterval) {
      intervalId = window.setInterval(refreshData, refetchInterval);
    }
    
    // Set up focus handler
    const handleFocus = () => {
      if (!isMounted.current || !refetchOnFocus) return;
      
      // Check if data is stale before refetching
      const queryState = queryClient.getQueryState(queryKey);
      const lastUpdatedAt = queryState?.dataUpdatedAt || 0;
      const isStale = Date.now() - lastUpdatedAt > staleTime;
      
      if (isStale) {
        console.log(`Data is stale for ${JSON.stringify(queryKey)}, refetching on focus`);
        refreshData();
      }
    };
    
    if (refetchOnFocus) {
      window.addEventListener('focus', handleFocus);
    }

    // Clean up
    return () => {
      isMounted.current = false;
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
      if (refetchOnFocus) {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [
    queryKey, 
    queryClient, 
    onlyInvalidate, 
    enabled, 
    refetchInterval,
    refetchOnFocus,
    staleTime,
    onRouteChange ? location.pathname : null
  ]);
}

// Hook for checking if the current route is active (for suspense-based components)
export function useIsRouteActive() {
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  
  useEffect(() => {
    pathRef.current = location.pathname;
  }, [location.pathname]);
  
  return () => pathRef.current === location.pathname;
}
