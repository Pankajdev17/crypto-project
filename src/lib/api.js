
import { toast } from "@/components/ui/use-toast";

const BASE_URL = "https://api.coingecko.com/api/v3";

// Track API requests to implement rate limiting
const requestTimestamps = [];
const RATE_LIMIT_COUNT = 50; // Increased from 30 to 50 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Simple in-memory cache with longer duration
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // Increased from 5 to 10 minutes cache duration
const STALE_CACHE_DURATION = 30 * 60 * 1000; // Allow stale cache to be used for 30 minutes

// Helper function to check if we're exceeding rate limits
function checkRateLimit() {
  // Don't apply rate limiting for the first 10 requests
  if (requestTimestamps.length < 10) {
    requestTimestamps.push(Date.now());
    return true;
  }

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

// Check if we have cached data
function getCachedData(url) {
  if (!cache.has(url)) return null;
  
  const { data, timestamp } = cache.get(url);
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

// Cache data with timestamp
function cacheData(url, data) {
  cache.set(url, {
    data,
    timestamp: Date.now()
  });
}

// Helper function for API fetching with retry logic, rate limiting and caching
export async function fetchWithRetry(url, options = {}, retries = 3, backoff = 300) {
  // Always check for cached data first
  const cachedData = getCachedData(url);
  if (cachedData) return cachedData;
  
  // Check if we're within rate limits
  if (!checkRateLimit()) {
    console.warn('Rate limit approached, using cached data if available or waiting');
    
    // Only show toast for severe rate limit cases after multiple requests
    if (requestTimestamps.length > RATE_LIMIT_COUNT * 0.9) {
      toast({
        variant: "warning",
        title: "API Rate Limit",
        description: `Using cached data while waiting for rate limit to reset.`
      });
    }
    
    // Check if we have some cache for this URL, even if expired
    const staleCache = cache.get(url);
    if (staleCache) {
      console.log(`Using stale cached data for: ${url}`);
      return staleCache.data;
    }
    
    // Wait a bit before proceeding
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
        const staleCache = cache.get(url);
        if (staleCache) {
          console.log(`Using stale cached data after 429 for: ${url}`);
          return staleCache.data;
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Cache successful responses
    cacheData(url, data);
    
    return data;
  } catch (error) {
    if (retries <= 0) {
      console.error(`Fetch failed after all retries: ${error.message}`);
      
      // Try to get stale cache as last resort
      const staleCache = cache.get(url);
      if (staleCache) {
        console.log(`Using stale cached data after error for: ${url}`);
        return staleCache.data;
      }
      
      // Return empty data instead of throwing to prevent UI crashes
      if (url.includes("markets")) return [];
      if (url.includes("global")) return { data: {} };
      if (url.includes("trending")) return { coins: [] };
      return {};
    }
    
    console.warn(`Retrying fetch for ${url}. Attempts remaining: ${retries}`);
    
    // Wait before retrying with exponential backoff
    await new Promise(resolve => setTimeout(resolve, backoff));
    
    return fetchWithRetry(url, options, retries - 1, backoff * 2);
  }
}

// Get trending coins
export async function getTrendingCoins() {
  try {
    return await fetchWithRetry(`${BASE_URL}/search/trending`);
  } catch (error) {
    console.error("Error fetching trending coins:", error);
    return { coins: [] };
  }
}

// Get market data for multiple coins
export async function getMarketData(currency = "usd", perPage = 20, page = 1, sparkline = false) {
  try {
    return await fetchWithRetry(
      `${BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}`
    );
  } catch (error) {
    console.error("Error fetching market data:", error);
    return [];
  }
}

// Get global crypto market data
export async function getGlobalData() {
  try {
    return await fetchWithRetry(`${BASE_URL}/global`);
  } catch (error) {
    console.error("Error fetching global data:", error);
    return { data: {} };
  }
}

// Get detailed data for a specific coin
export async function getCoinDetails(coinId) {
  if (!coinId) return {};
  
  try {
    return await fetchWithRetry(`${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`);
  } catch (error) {
    console.error(`Error fetching coin details for ${coinId}:`, error);
    return {};
  }
}

// Get market chart data for a coin
export async function getCoinMarketChart(coinId, currency = "usd", days = 7) {
  if (!coinId) return { prices: [] };
  
  try {
    return await fetchWithRetry(`${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`);
  } catch (error) {
    console.error(`Error fetching market chart for ${coinId}:`, error);
    return { prices: [] };
  }
}

// Get user's portfolio data (mock implementation)
export async function getPortfolioData() {
  // Simulate network delay and occasional failures to test error handling
  return new Promise((resolve) => {
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

// Helper to format large numbers
export function formatCurrency(value, decimals = 2) {
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
export function formatPercentage(value) {
  if (value === undefined || value === null) return "N/A";
  
  const formattedValue = value.toFixed(2);
  return `${formattedValue}%`;
}

// Format date for charts
export function formatChartDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString();
}
