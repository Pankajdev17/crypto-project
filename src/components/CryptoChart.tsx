import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api, formatChartDate } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FallbackContent from './FallbackContent';
import { useRouteRefresh, useIsRouteActive } from '@/hooks/useRouteRefresh';

interface CryptoChartProps {
  coinId: string;
  coinName: string;
}

const timeOptions = [
  { value: '1', label: '24h' },
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
  { value: '365', label: '1y' },
];

const ChartPlaceholder = () => (
  <div className="h-[400px] w-full bg-muted/30 rounded-lg animate-pulse" />
);

const CryptoChart: React.FC<CryptoChartProps> = ({ coinId, coinName }) => {
  const [timeframe, setTimeframe] = useState('7');
  const isRouteActive = useIsRouteActive();
  
  useRouteRefresh(['chart', coinId, timeframe], {
    refetchInterval: 30000,
    staleTime: 60 * 1000,
  });
  
  useEffect(() => {
    setTimeframe('7');
  }, [coinId]);
  
  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['chart', coinId, timeframe],
    queryFn: () => api.getCoinMarketChart(coinId, 'usd', timeframe),
    retry: 2,
    enabled: !!coinId,
    staleTime: 15 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const chartData = useMemo(() => {
    if (!data?.prices || !data.prices.length) return [];
    
    const prices = data.prices;
    let downsampledPrices = prices;
    
    if (prices.length > 200) {
      const factor = Math.ceil(prices.length / 200);
      downsampledPrices = prices.filter((_, i) => i % factor === 0);
    }
    
    return downsampledPrices.map((item) => ({
      date: formatChartDate(item[0]),
      timestamp: item[0],
      price: item[1],
    }));
  }, [data]);

  const color = useMemo(() => {
    if (chartData.length <= 1) return '#10b981';
    return chartData[0].price < chartData[chartData.length - 1].price 
      ? '#10b981'
      : '#ef4444';
  }, [chartData]);

  const handleRefresh = () => {
    if (isRouteActive()) {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartPlaceholder />
        </CardContent>
      </Card>
    );
  }

  if (isError || !chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <FallbackContent 
            error={true} 
            message={error instanceof Error ? error.message : "Failed to load chart data."}
            onRetry={handleRefresh}
          />
          <ChartPlaceholder />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            {coinName} Price Chart
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 h-6 w-6" 
              onClick={handleRefresh}
              title="Refresh chart data"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
            </Button>
          </CardTitle>
          <Tabs 
            defaultValue={timeframe} 
            value={timeframe}
            onValueChange={setTimeframe} 
            className="w-auto"
          >
            <TabsList>
              {timeOptions.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  if (timeframe === '1') {
                    const date = new Date(value);
                    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  }
                  return value;
                }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false}
                domain={['auto', 'auto']}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <Tooltip 
                formatter={(value) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={color} 
                fillOpacity={1}
                fill="url(#colorPrice)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(CryptoChart);
