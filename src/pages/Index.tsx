import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/apiClient';
import MainLayout from '@/layouts/MainLayout';
import TrendingCoins from '@/components/TrendingCoins';
import CryptoCard from '@/components/CryptoCard';
import CryptoTable from '@/components/CryptoTable';
import { 
  ArrowRightIcon, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Bitcoin,
  RefreshCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouteRefresh } from '@/hooks/useRouteRefresh';
import { toast } from '@/components/ui/use-toast';
import { invalidateQueriesByPattern } from '@/lib/queryClient';

interface GlobalData {
  data?: {
    total_market_cap?: {
      usd?: number;
    };
    total_volume?: {
      usd?: number;
    };
    market_cap_percentage?: {
      btc?: number;
    };
    market_cap_change_percentage_24h_usd?: number;
  };
}

const Index = () => {
  const queryClient = useQueryClient();
  
  // Use our improved route refresh hooks
  useRouteRefresh(['marketData'], {
    refetchInterval: 60000, // Refresh every minute
  });
  
  useRouteRefresh(['globalData'], {
    refetchInterval: 60000,
  });
  
  // Fetch market data for top cryptocurrencies
  const { 
    data: marketData, 
    isLoading: marketLoading,
    refetch: refetchMarketData
  } = useQuery({
    queryKey: ['marketData'],
    queryFn: () => api.getMarketData('usd', 10),
    staleTime: 15 * 1000, // 15 seconds
  });

  // Fetch global crypto market data
  const { 
    data: globalData, 
    isLoading: globalLoading,
    refetch: refetchGlobalData
  } = useQuery<GlobalData>({
    queryKey: ['globalData'],
    queryFn: api.getGlobalData,
    staleTime: 15 * 1000, // 15 seconds
  });

  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A';
    return `$${(marketCap / 1000000000000).toFixed(2)}T`;
  };

  const formatVolume = (volume?: number) => {
    if (!volume) return 'N/A';
    return `$${(volume / 1000000000).toFixed(2)}B`;
  };
  
  // Handle refresh of all dashboard data
  const handleRefreshAll = () => {
    toast({
      title: "Refreshing dashboard",
      description: "Fetching latest cryptocurrency data",
      duration: 3000,
    });
    
    // Use our query utility to invalidate all related queries
    invalidateQueriesByPattern('market');
    invalidateQueriesByPattern('global');
    invalidateQueriesByPattern('trending');
    
    refetchMarketData();
    refetchGlobalData();
  };

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cryptocurrency Dashboard</h1>
          <p className="text-muted-foreground">
            Track real-time cryptocurrency prices, market trends, and insights.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleRefreshAll}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh All
        </Button>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Global Market Cap
            </CardTitle>
          </CardHeader>
          <CardContent>
            {globalLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatMarketCap(globalData?.data?.total_market_cap?.usd)}
              </div>
            )}
            {!globalLoading && globalData?.data && (
              <div className={`text-sm flex items-center mt-1 ${
                (globalData.data.market_cap_change_percentage_24h_usd || 0) >= 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {(globalData.data.market_cap_change_percentage_24h_usd || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {globalData.data.market_cap_change_percentage_24h_usd?.toFixed(2)}% (24h)
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              24h Trading Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {globalLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {formatVolume(globalData?.data?.total_volume?.usd)}
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-1">
              Across all cryptocurrencies
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-primary" />
              BTC Dominance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {globalLoading ? (
              <Skeleton className="h-7 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {globalData?.data?.market_cap_percentage?.btc?.toFixed(2)}%
              </div>
            )}
            <div className="text-sm text-muted-foreground mt-1">
              Of total market capitalization
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trending Section */}
      <div className="mb-8">
        <TrendingCoins />
      </div>
      
      {/* Top Cryptocurrencies */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Top Cryptocurrencies</h2>
        <Link to="/market">
          <Button variant="outline" size="sm" className="group">
            View All
            <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
      
      {/* Featured Coins Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {marketLoading
          ? Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-28 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))
          : marketData?.slice(0, 4).map((coin) => (
              <CryptoCard key={coin.id} coin={coin} />
            ))}
      </div>
      
      {/* Market Table */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Market Overview</h2>
        <CryptoTable coins={marketData || []} isLoading={marketLoading} />
      </div>
    </MainLayout>
  );
};

export default Index;
