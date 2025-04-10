
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMarketData } from '@/lib/api';
import MainLayout from '@/layouts/MainLayout';
import CryptoTable from '@/components/CryptoTable';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RefreshCcw } from 'lucide-react';
import FallbackContent from '@/components/FallbackContent';
import { toast } from '@/components/ui/use-toast';
import { useRouteRefresh } from '@/hooks/useRouteRefresh';
import { useLocation } from 'react-router-dom';

const Market = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Use our custom hook to ensure data refreshes on route changes
  useRouteRefresh(['marketData', page, perPage], {
    refetchInterval: 60000, // Refresh every minute while on page
  });
  
  // Reset to page 1 when returning to this route
  useEffect(() => {
    setPage(1);
  }, [location.key]);
  
  // Implement debouncing for search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // 300ms debounce
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);
  
  // Fetch market data with pagination
  const { 
    data, 
    isLoading, 
    error, 
    isPending, 
    isPlaceholderData,
    refetch
  } = useQuery({
    queryKey: ['marketData', page, perPage],
    queryFn: () => getMarketData('usd', perPage, page),
    placeholderData: (previousData) => previousData, // This replaces keepPreviousData
    staleTime: 15 * 1000, // 15 seconds
    retry: 3,
    refetchOnMount: "always",
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  });
  
  // Filter coins based on search query
  const filteredCoins = React.useMemo(() => {
    if (!data) return [];
    
    return data.filter((coin) => 
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [data, searchQuery]);
  
  // Handle page change with boundary check
  const handlePageChange = useCallback((newPage) => {
    if (newPage > 0) {
      setPage(newPage);
      window.scrollTo(0, 0);
    }
  }, []);

  // Handle manual refresh
  const handleRefresh = () => {
    toast({
      title: "Refreshing data",
      description: "Fetching latest cryptocurrency market data",
      duration: 3000,
    });
    // Invalidate and refetch all market data queries
    queryClient.invalidateQueries({ 
      queryKey: ['marketData'], 
      refetchType: 'all',
      exact: false // Also invalidate queries with additional keys like pagination
    });
    refetch();
  };
  
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cryptocurrency Market</h1>
        <p className="text-muted-foreground">
          Track prices, market cap, and trading volume for cryptocurrencies across the market.
        </p>
      </div>
      
      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cryptocurrencies..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Select 
            value={perPage.toString()} 
            onValueChange={(value) => {
              setPerPage(Number(value));
              setPage(1); // Reset to first page on changing items per page
            }}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Show 50" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Show 10</SelectItem>
              <SelectItem value="50">Show 50</SelectItem>
              <SelectItem value="100">Show 100</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={handleRefresh} title="Refresh data">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Market Table */}
      <div className="mb-6">
        {error ? (
          <FallbackContent 
            error={true}
            message="Failed to load market data. Please try again later."
            onRetry={refetch}
          />
        ) : (
          <CryptoTable 
            coins={filteredCoins} 
            isLoading={isLoading} 
          />
        )}
        
        {/* Pagination */}
        {!error && !isLoading && (
          <div className="flex justify-between items-center mt-6">
            <Button
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || isPending}
            >
              Previous
            </Button>
            
            <div className="text-sm text-muted-foreground">
              Page {page}
            </div>
            
            <Button
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={filteredCoins.length < perPage || isPlaceholderData}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Market;
