
import { toast } from "@/components/ui/use-toast";

const BASE_URL = "https://api.coingecko.com/api/v3";

// Track API requests to implement rate limiting
const requestTimestamps: number[] = [];
const RATE_LIMIT_COUNT = 50; // Maximum requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Cache configuration
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache duration
const STALE_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes stale cache duration

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(url: string): T | null {
    if (!this.cache.has(url)) return null;
    
    const { data, timestamp } = this.cache.get(url) as CacheEntry<T>;
    const now = Date.now();
    
    // Return fresh cached data if it's still valid
    if (now - timestamp < CACHE_DURATION) {
      console.log(`Using fresh cached data for: ${url}`);
      return data;
    }
    
    // Return stale cached data if within stale window
    if (now - timestamp < STALE_CACHE_DURATION) {
      console.log(`Using stale cached data for: ${url}`);
      return data;
    }
    
    return null;
  }

  set<T>(url: string, data: T): void {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
  }

  invalidate(urlPattern?: string): void {
    if (!urlPattern) {
      this.cache.clear();
      return;
    }

    // Delete all cache entries that match the pattern
    for (const url of this.cache.keys()) {
      if (url.includes(urlPattern)) {
        this.cache.delete(url);
      }
    }
  }
}

// Create a singleton cache instance
export const apiCache = new ApiCache();

// Check if we're exceeding rate limits
function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Remove timestamps older than our window
  const recentRequests = requestTimestamps.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Update our tracking array with only recent requests
  requestTimestamps.length = 0;
  requestTimestamps.push(...recentRequests);
  
  // Add current request timestamp
  requestTimestamps.push(now);
  
  // Check if we're over the limit
  return requestTimestamps.length <= RATE_LIMIT_COUNT;
}

// API client with error handling, caching and retries
export async function fetchWithCache<T>(
  url: string, 
  options: RequestInit = {}, 
  retries = 3, 
  backoff = 300,
  bypassCache = false
): Promise<T> {
  // Check cache first (unless explicitly bypassing)
  if (!bypassCache) {
    const cachedData = apiCache.get<T>(url);
    if (cachedData) return cachedData;
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    console.warn('Rate limit approached, using cached data if available or waiting');
    
    if (requestTimestamps.length > RATE_LIMIT_COUNT * 0.9) {
      toast({
        variant: "warning",
        title: "API Rate Limit",
        description: "Using cached data while waiting for rate limit to reset."
      });
    }
    
    // Check for stale cache as fallback
    const staleCache = apiCache.get<T>(url);
    if (staleCache) return staleCache;
    
    // Wait a bit before proceeding if no cache available
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  try {
    console.log(`Fetching data from: ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 429) {
        console.warn("API rate limit exceeded from server response");
        
        toast({
          variant: "warning",
          title: "API Rate Limit",
          description: "The crypto data provider is limiting requests. Using cached data where available."
        });
        
        // Use stale cache if available
        const staleCache = apiCache.get<T>(url);
        if (staleCache) return staleCache;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache successful responses
    apiCache.set(url, data);
    
    return data as T;
  } catch (error) {
    if (retries <= 0) {
      console.error(`Fetch failed after all retries: ${error instanceof Error ? error.message : String(error)}`);
      
      // Try to get stale cache as last resort
      const staleCache = apiCache.get<T>(url);
      if (staleCache) return staleCache;
      
      throw error;
    }
    
    console.warn(`Retrying fetch for ${url}. Attempts remaining: ${retries}`);
    
    // Wait before retrying with exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    return fetchWithCache<T>(url, options, retries - 1, backoff * 2, bypassCache);
  }
}

// API endpoints with proper typing
export const api = {
  // Get trending coins
  getTrendingCoins: async () => {
    try {
      interface TrendingCoinsResponse {
        coins: Array<{
          item: {
            id: string;
            name: string;
            symbol: string;
            small: string;
            market_cap_rank?: number;
          };
        }>;
      }
      
      return await fetchWithCache<TrendingCoinsResponse>(`${BASE_URL}/search/trending`);
    } catch (error) {
      console.error("Error fetching trending coins:", error);
      return { coins: [] };
    }
  },
  
  // Get market data for multiple coins
  getMarketData: async (currency = "usd", perPage = 20, page = 1, sparkline = false) => {
    try {
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
      
      return await fetchWithCache<Coin[]>(
        `${BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}`
      );
    } catch (error) {
      console.error("Error fetching market data:", error);
      return [];
    }
  },
  
  // Get global crypto market data
  getGlobalData: async () => {
    try {
      interface GlobalData {
        data: {
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
      
      return await fetchWithCache<GlobalData>(`${BASE_URL}/global`);
    } catch (error) {
      console.error("Error fetching global data:", error);
      return { data: {} };
    }
  },
  
  // Get detailed data for a specific coin
  getCoinDetails: async (coinId: string) => {
    if (!coinId) return {};
    
    try {
      // We don't define the full type here as it's quite complex
      return await fetchWithCache<any>(
        `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`
      );
    } catch (error) {
      console.error(`Error fetching coin details for ${coinId}:`, error);
      return {};
    }
  },
  
  // Get market chart data for a coin
  getCoinMarketChart: async (coinId: string, currency = "usd", days = 7) => {
    if (!coinId) return { prices: [] };
    
    try {
      interface MarketChartData {
        prices: [number, number][];
        market_caps?: [number, number][];
        total_volumes?: [number, number][];
      }
      
      return await fetchWithCache<MarketChartData>(
        `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`
      );
    } catch (error) {
      console.error(`Error fetching market chart for ${coinId}:`, error);
      return { prices: [] };
    }
  },
  
  // Get user's portfolio data (mock implementation)
  getPortfolioData: async () => {
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
    
    // Simulate network delay and occasional failures to test error handling
    return new Promise<PortfolioItem[]>((resolve) => {
      setTimeout(() => {
        // Mock data for demonstration
        resolve([
          {
            id: "bitcoin",
            symbol: "btc",
            name: "Bitcoin",
            image: "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png",
            current_price: 76247,
            amount: 0.05,
            value_usd: 3812.35,
            price_change_percentage_24h: -4.61
          },
          {
            id: "ethereum",
            symbol: "eth",
            name: "Ethereum",
            image: "https://coin-images.coingecko.com/coins/images/279/large/ethereum.png",
            current_price: 1452.33,
            amount: 1.2,
            value_usd: 1742.80,
            price_change_percentage_24h: -8.45
          },
          {
            id: "solana",
            symbol: "sol",
            name: "Solana",
            image: "https://coin-images.coingecko.com/coins/images/4128/large/solana.png",
            current_price: 103.72,
            amount: 5,
            value_usd: 518.60,
            price_change_percentage_24h: -6.87
          }
        ]);
      }, 800);
    });
  }
};

// Formatting utilities
export function formatCurrency(value: number | undefined | null, decimals = 2): string {
  if (value === undefined || value === null) return "N/A";
  
  if (value > 1000000000) {
    return `$${(value / 1000000000).toFixed(decimals)}B`;
  } else if (value > 1000000) {
    return `$${(value / 1000000).toFixed(decimals)}M`;
  } else if (value > 1000) {
    return `$${(value / 1000).toFixed(decimals)}K`;
  }
  
  return `$${value.toFixed(decimals)}`;
}

// Format percentage change
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null) return "N/A";
  return `${value.toFixed(2)}%`;
}

// Format date for charts
export function formatChartDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
