
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCcw, InboxIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FallbackContentProps {
  error?: boolean;
  loading?: boolean;
  emptyState?: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;
  onRetry?: () => void;
}

const FallbackContent = ({
  error = false,
  loading = false,
  emptyState = false,
  title = 'No Data Available',
  message = 'The requested information could not be found.',
  onRetry,
  children
}: FallbackContentProps) => {
  
  if (loading) {
    return (
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-40 w-full rounded-md" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="animate-in fade-in duration-300">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          {message || 'There was a problem fetching the data. Using cached data if available.'}
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              className="self-start mt-2 flex items-center gap-1"
              onClick={onRetry}
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry Now
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (emptyState) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <InboxIcon className="h-5 w-5 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{message}</p>
          {children}
        </CardContent>
      </Card>
    );
  }
  
  return <>{children}</>;
};

export default FallbackContent;
