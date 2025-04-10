
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp, RefreshCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouteRefresh } from '@/hooks/useRouteRefresh';
import FallbackContent from '@/components/FallbackContent';

interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    small: string;
    market_cap_rank?: number;
  };
}

interface TrendingCoinsData {
  coins?: TrendingCoin[];
}

const TrendingCoins = () => {
  const queryClient = useQueryClient();
  
  // Use our improved hook for data refreshing
  useRouteRefresh(['trending'], {
    refetchInterval: 120000, // 2 minutes
    staleTime: 60000, // 1 minute
  });

  const { data, error, isLoading, refetch, isError } = useQuery<TrendingCoinsData>({
    queryKey: ['trending'],
    queryFn: api.getTrendingCoins,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnMount: "always",
  });

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['trending'] });
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Trending Coins</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-3 rounded-md border">
                <Skeleton className="h-6 w-28 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>Trending Coins</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FallbackContent 
            error={true}
            message="Failed to fetch trending coins"
            onRetry={handleRetry}
          />
        </CardContent>
      </Card>
    );
  }

  const trendingCoins = data?.coins?.slice(0, 6) || [];

  if (trendingCoins.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>Trending Coins</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-2">No trending coins available at the moment.</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Trending Coins</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {trendingCoins.map((item) => (
            <Link 
              key={item.item.id} 
              to={`/crypto/${item.item.id}`}
              className="p-3 rounded-md border hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <img 
                  src={item.item.small} 
                  alt={item.item.name} 
                  className="w-5 h-5 rounded-full"
                  loading="lazy"
                />
                <span className="font-medium">{item.item.name}</span>
                <span className="text-xs text-muted-foreground uppercase">{item.item.symbol}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Rank: #{item.item.market_cap_rank || 'N/A'}
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRetry}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          
          <Link to="/market" className="text-primary text-sm flex items-center gap-1 hover:underline">
            View all coins <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingCoins;
