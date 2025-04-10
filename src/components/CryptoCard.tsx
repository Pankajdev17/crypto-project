
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PriceChange from './PriceChange';
import { formatCurrency } from '@/lib/api';

interface CryptoCardProps {
  coin: {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    price_change_percentage_24h: number;
    market_cap: number;
  };
}

const CryptoCard = ({ coin }: CryptoCardProps) => {
  return (
    <Link to={`/crypto/${coin.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center gap-2">
              <img src={coin.image} alt={coin.name} className="w-6 h-6" />
              {coin.name}
              <span className="text-xs text-muted-foreground uppercase">{coin.symbol}</span>
            </CardTitle>
            <PriceChange value={coin.price_change_percentage_24h} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-1">{formatCurrency(coin.current_price)}</div>
          <div className="text-sm text-muted-foreground">
            Market Cap: {formatCurrency(coin.market_cap, 0)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default CryptoCard;
