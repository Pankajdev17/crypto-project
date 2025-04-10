
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import PriceChange from './PriceChange';
import { formatCurrency } from '@/lib/api';

interface Coin {
  id: string;
  market_cap_rank: number;
  image: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
}

interface CryptoTableProps {
  coins: Coin[];
  isLoading?: boolean;
}

const CryptoTable = ({ coins, isLoading = false }: CryptoTableProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Coin | null;
    direction: 'ascending' | 'descending';
  }>({
    key: 'market_cap_rank',
    direction: 'ascending',
  });

  const handleSort = (key: keyof Coin) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  const sortedCoins = React.useMemo(() => {
    if (!sortConfig.key) return coins;
    
    return [...coins].sort((a, b) => {
      if (a[sortConfig.key!] < b[sortConfig.key!]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key!] > b[sortConfig.key!]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [coins, sortConfig]);

  const renderSortIcon = (key: keyof Coin) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'ascending' ? (
      <ChevronUp className="inline h-4 w-4" />
    ) : (
      <ChevronDown className="inline h-4 w-4" />
    );
  };

  const renderSortableHeader = (label: string, key: keyof Coin) => (
    <div 
      className="flex items-center gap-1 cursor-pointer hover:text-primary"
      onClick={() => handleSort(key)}
    >
      {label} {renderSortIcon(key)}
    </div>
  );

  if (isLoading) {
    return (
      <div className="crypto-table-wrapper">
        <Table className="crypto-table">
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>24h %</TableHead>
              <TableHead className="hidden md:table-cell">Market Cap</TableHead>
              <TableHead className="hidden md:table-cell">Volume (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 10 }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 6 }).map((_, cellIndex) => (
                  <TableCell key={cellIndex} className={cellIndex >= 4 ? "hidden md:table-cell" : ""}>
                    <div className="h-6 rounded loading-pulse"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="crypto-table-wrapper">
      <Table className="crypto-table">
        <TableHeader>
          <TableRow>
            <TableHead>{renderSortableHeader('#', 'market_cap_rank')}</TableHead>
            <TableHead>{renderSortableHeader('Name', 'name')}</TableHead>
            <TableHead>{renderSortableHeader('Price', 'current_price')}</TableHead>
            <TableHead>{renderSortableHeader('24h %', 'price_change_percentage_24h')}</TableHead>
            <TableHead className="hidden md:table-cell">{renderSortableHeader('Market Cap', 'market_cap')}</TableHead>
            <TableHead className="hidden md:table-cell">{renderSortableHeader('Volume (24h)', 'total_volume')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCoins.map((coin) => (
            <TableRow key={coin.id} className="hover:bg-muted/50">
              <TableCell>{coin.market_cap_rank}</TableCell>
              <TableCell>
                <Link to={`/crypto/${coin.id}`} className="flex items-center gap-2 hover:text-primary">
                  <img src={coin.image} alt={coin.name} className="w-6 h-6" />
                  <span className="font-medium">{coin.name}</span>
                  <span className="text-xs text-muted-foreground uppercase">{coin.symbol}</span>
                </Link>
              </TableCell>
              <TableCell>{formatCurrency(coin.current_price)}</TableCell>
              <TableCell>
                <PriceChange value={coin.price_change_percentage_24h} />
              </TableCell>
              <TableCell className="hidden md:table-cell">{formatCurrency(coin.market_cap, 0)}</TableCell>
              <TableCell className="hidden md:table-cell">{formatCurrency(coin.total_volume, 0)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CryptoTable;
