
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPortfolioData, formatCurrency } from '@/lib/api';
import MainLayout from '@/layouts/MainLayout';
import PriceChange from '@/components/PriceChange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, ArrowRightIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import FallbackContent from '@/components/FallbackContent';
import { toast } from '@/components/ui/use-toast';

// Define the portfolio item type
interface PortfolioItem {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  amount: number;
  value_usd: number;
  price_change_percentage_24h: number;
}

const Portfolio = () => {
  const { data: portfolioData, isLoading, error, refetch, isError } = useQuery<PortfolioItem[]>({
    queryKey: ['portfolioData'],
    queryFn: getPortfolioData,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const handleRetry = () => {
    toast({
      title: "Retrying",
      description: "Fetching latest portfolio data...",
      duration: 3000,
    });
    refetch();
  };

  // Calculate portfolio total value
  const totalValue = React.useMemo(() => {
    if (!portfolioData) return 0;
    return portfolioData.reduce((total, coin) => total + coin.value_usd, 0);
  }, [portfolioData]);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Portfolio</h1>
        <p className="text-muted-foreground">
          Track and manage your cryptocurrency investments in one place.
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <FallbackContent loading />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalValue, 2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Across {portfolioData?.length || 0} assets
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Recommended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-md font-medium">
              Diversify your portfolio
            </div>
            <div className="flex mt-2">
              <Link to="/market">
                <Button variant="outline" size="sm" className="group">
                  Explore More Coins
                  <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio List */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Your Assets</h2>
        
        {isLoading ? (
          <FallbackContent loading />
        ) : isError ? (
          <FallbackContent 
            error 
            message="Failed to load portfolio data. Please try again later."
            onRetry={handleRetry}
          />
        ) : (
          <>
            {!portfolioData || portfolioData.length === 0 ? (
              <FallbackContent 
                emptyState
                title="No assets yet"
                message="You haven't added any assets to your portfolio yet."
              >
                <div className="mt-3">
                  <Link to="/market">
                    <Button variant="outline" size="sm">
                      Browse Market
                    </Button>
                  </Link>
                </div>
              </FallbackContent>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset</TableHead>
                      <TableHead>Holdings</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>24h %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {portfolioData.map((coin) => (
                      <TableRow key={coin.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link to={`/crypto/${coin.id}`} className="flex items-center gap-2 hover:text-primary">
                            <img src={coin.image} alt={coin.name} className="w-6 h-6" loading="lazy" />
                            <span className="font-medium">{coin.name}</span>
                            <span className="text-xs text-muted-foreground uppercase">{coin.symbol}</span>
                          </Link>
                        </TableCell>
                        <TableCell>{coin.amount} {coin.symbol.toUpperCase()}</TableCell>
                        <TableCell>{formatCurrency(coin.current_price)}</TableCell>
                        <TableCell>{formatCurrency(coin.value_usd)}</TableCell>
                        <TableCell>
                          <PriceChange value={coin.price_change_percentage_24h} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Portfolio;
