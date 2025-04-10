
import React from 'react';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceChangeProps {
  value: number;
  showIcon?: boolean;
  className?: string;
}

const PriceChange = ({ value, showIcon = true, className }: PriceChangeProps) => {
  const isPositive = value >= 0;
  const formattedValue = `${isPositive ? '+' : ''}${value.toFixed(2)}%`;
  
  return (
    <div className={cn(
      'flex items-center font-medium',
      isPositive ? 'text-green-500' : 'text-red-500',
      className
    )}>
      {showIcon && (
        isPositive ? (
          <ArrowUpCircle className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDownCircle className="h-4 w-4 mr-1" />
        )
      )}
      <span>{formattedValue}</span>
    </div>
  );
};

export default PriceChange;
