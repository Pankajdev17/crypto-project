import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, formatCurrency } from '@/lib/apiClient';
import MainLayout from '@/layouts/MainLayout';
import CryptoChart from '@/components/CryptoChart';
import PriceChange from '@/components/PriceChange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import FallbackContent from '@/components/FallbackContent';
import { useRouteRefresh } from '@/hooks/useRouteRefresh';
import { 
  ArrowLeft, 
  ExternalLink, 
  GithubIcon, 
  Globe, 
  BarChart3, 
  Star, 
  Share2,
  DollarSign, 
  TrendingUp,
  RefreshCcw
} from 'lucide-react';

const CryptoDetails = () => {
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  
  useRouteRefresh(['coinDetails', coinId], {
    refetchInterval: 30000,
  });
  
  const { 
    data, 
    isLoading, 
    error, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['coinDetails', coinId],
    queryFn: () => api.getCoinDetails(coinId || ''),
    retry: 2,
    enabled: !!coinId,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 15 * 1000,
  });
  
  useEffect(() => {
    if (data?.name && data?.symbol) {
      document.title = `${data.name} (${data.symbol.toUpperCase()}) Price | CryptoBeacon`;
    } else {
      document.title = 'Cryptocurrency Details | CryptoBeacon';
    }
    return () => {
      document.title = 'CryptoBeacon Dashboard';
    };
  }, [data]);
  
  const handleBack = () => {
    navigate(-1);
  };
  
  const handleRefresh = () => {
    refetch();
  };
  
  if (isError) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <FallbackContent 
            error={true} 
            title="Cryptocurrency Not Found"
            message="The cryptocurrency you're looking for doesn't exist or couldn't be loaded."
            onRetry={handleRefresh}
          >
            <Button onClick={handleBack} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </FallbackContent>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        {isLoading ? (
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src={data?.image?.large} 
                  alt={data?.name || 'Cryptocurrency'} 
                  className="w-10 h-10" 
                />
                <h1 className="text-3xl font-bold">{data?.name || 'Loading...'}</h1>
                <span className="text-lg text-muted-foreground uppercase">{data?.symbol || ''}</span>
                {data?.market_cap_rank && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    Rank #{data.market_cap_rank}
                  </span>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 h-7 w-7" 
                  onClick={handleRefresh}
                  title="Refresh data"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                {data?.links?.homepage?.[0] && (
                  <a 
                    href={data.links.homepage[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                
                {data?.links?.blockchain_site?.[0] && (
                  <a 
                    href={data.links.blockchain_site[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Explorer
                  </a>
                )}
                
                {data?.links?.repos_url?.github?.[0] && (
                  <a 
                    href={data.links.repos_url.github[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                  >
                    <GithubIcon className="h-4 w-4" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Favorite
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="mb-6">
          <Skeleton className="h-14 w-40 mb-2" />
          <Skeleton className="h-6 w-32" />
        </div>
      ) : (
        <div className="mb-8">
          <div className="text-4xl font-bold mb-1">
            {formatCurrency(data?.market_data?.current_price?.usd, 2)}
          </div>
          <div className="flex items-center gap-3">
            <PriceChange 
              value={data?.market_data?.price_change_percentage_24h || 0} 
              className="text-base"
            />
            <span className="text-sm text-muted-foreground">
              (Past 24 hours)
            </span>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full rounded-lg" />
        ) : (
          <CryptoChart 
            coinId={coinId || ''} 
            coinName={data?.name || 'Cryptocurrency'} 
          />
        )}
      </div>
      
      <h2 className="text-2xl font-bold mb-4">{data?.name || 'Cryptocurrency'} Market Stats</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Market Cap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.market_data?.market_cap?.usd, 0)}
                </div>
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
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.market_data?.total_volume?.usd, 0)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Circulating Supply
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.market_data?.circulating_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 })} {data?.symbol?.toUpperCase() || ''}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  24h Low / High
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex gap-2">
                  <span className="text-red-500">
                    {formatCurrency(data?.market_data?.low_24h?.usd)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-green-500">
                    {formatCurrency(data?.market_data?.high_24h?.usd)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  All-Time High
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.market_data?.ath?.usd)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <PriceChange 
                    value={data?.market_data?.ath_change_percentage?.usd || 0} 
                    showIcon={false} 
                    className="text-xs"
                  />
                  <span>from ATH</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  All-Time Low
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data?.market_data?.atl?.usd)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <PriceChange 
                    value={data?.market_data?.atl_change_percentage?.usd || 0} 
                    showIcon={false} 
                    className="text-xs"
                  />
                  <span>from ATL</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {!isLoading && data?.description?.en && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">About {data.name || 'Cryptocurrency'}</h2>
          <Card>
            <CardContent className="pt-6">
              <div 
                className="prose max-w-none prose-headings:text-foreground prose-p:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: data.description.en }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};

export default CryptoDetails;
