// Financial Modeling Prep API for stock market indices
const FMP_API_KEY = '5CUgTXPkdfQfArsKbd6qDdSzhz22bN8l';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Major world indices with their symbols
export const WORLD_INDICES = [
  // Europe
  { symbol: '^AEX', name: 'AEX', country: 'Netherlands', flag: '🇳🇱', region: 'Europe' },
  { symbol: '^GDAXI', name: 'DAX', country: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { symbol: '^FTSE', name: 'FTSE 100', country: 'UK', flag: '🇬🇧', region: 'Europe' },
  { symbol: '^FCHI', name: 'CAC 40', country: 'France', flag: '🇫🇷', region: 'Europe' },
  { symbol: '^STOXX50E', name: 'Euro Stoxx 50', country: 'Europe', flag: '🇪🇺', region: 'Europe' },
  
  // Americas
  { symbol: '^GSPC', name: 'S&P 500', country: 'USA', flag: '🇺🇸', region: 'Americas' },
  { symbol: '^DJI', name: 'Dow Jones', country: 'USA', flag: '🇺🇸', region: 'Americas' },
  { symbol: '^IXIC', name: 'NASDAQ', country: 'USA', flag: '🇺🇸', region: 'Americas' },
  
  // Asia-Pacific
  { symbol: '^N225', name: 'Nikkei 225', country: 'Japan', flag: '🇯🇵', region: 'Asia-Pacific' },
  { symbol: '^HSI', name: 'Hang Seng', country: 'Hong Kong', flag: '🇭🇰', region: 'Asia-Pacific' },
  { symbol: '000001.SS', name: 'SSE Composite', country: 'China', flag: '🇨🇳', region: 'Asia-Pacific' },
  { symbol: '^AXJO', name: 'ASX 200', country: 'Australia', flag: '🇦🇺', region: 'Asia-Pacific' },
];

// Cache for API responses
let indicesCache = {
  data: null,
  timestamp: null,
  ttl: 60000, // 1 minute cache
};

/**
 * Get quotes for all major indices
 */
export const getIndicesQuotes = async () => {
  // Check cache first
  if (indicesCache.data && indicesCache.timestamp && 
      Date.now() - indicesCache.timestamp < indicesCache.ttl) {
    return indicesCache.data;
  }

  try {
    // Fetch quotes for all indices
    const symbols = WORLD_INDICES.map(i => i.symbol).join(',');
    const response = await fetch(
      `${FMP_BASE_URL}/quote/${symbols}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch indices data');
    }
    
    const data = await response.json();
    
    // Merge API data with our index info
    const enrichedData = WORLD_INDICES.map(index => {
      const quote = data.find(q => q.symbol === index.symbol);
      return {
        ...index,
        price: quote?.price || null,
        change: quote?.change || 0,
        changesPercentage: quote?.changesPercentage || 0,
        dayHigh: quote?.dayHigh || null,
        dayLow: quote?.dayLow || null,
        previousClose: quote?.previousClose || null,
        open: quote?.open || null,
        volume: quote?.volume || null,
        timestamp: quote?.timestamp || null,
      };
    });
    
    // Update cache
    indicesCache = {
      data: enrichedData,
      timestamp: Date.now(),
      ttl: 60000,
    };
    
    return enrichedData;
  } catch (error) {
    console.error('Error fetching indices:', error);
    
    // Return cached data if available, even if stale
    if (indicesCache.data) {
      return indicesCache.data;
    }
    
    // Return empty data with index info
    return WORLD_INDICES.map(index => ({
      ...index,
      price: null,
      change: 0,
      changesPercentage: 0,
      error: true,
    }));
  }
};

/**
 * Get historical data for a specific index
 */
export const getIndexHistory = async (symbol, days = 30) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/historical-price-full/${symbol}?timeseries=${days}&apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical data');
    }
    
    const data = await response.json();
    return data.historical || [];
  } catch (error) {
    console.error('Error fetching index history:', error);
    return [];
  }
};

/**
 * Get market status (open/closed)
 */
export const getMarketStatus = () => {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const dayOfWeek = now.getUTCDay();
  
  // Weekend check
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      europe: { open: false, status: 'Closed (Weekend)' },
      americas: { open: false, status: 'Closed (Weekend)' },
      asiaPacific: { open: false, status: 'Closed (Weekend)' },
    };
  }
  
  const timeInMinutes = utcHour * 60 + utcMinutes;
  
  return {
    europe: {
      // European markets: ~7:00-15:30 UTC
      open: timeInMinutes >= 7 * 60 && timeInMinutes <= 15.5 * 60,
      status: timeInMinutes >= 7 * 60 && timeInMinutes <= 15.5 * 60 ? 'Open' : 'Closed',
    },
    americas: {
      // US markets: ~14:30-21:00 UTC
      open: timeInMinutes >= 14.5 * 60 && timeInMinutes <= 21 * 60,
      status: timeInMinutes >= 14.5 * 60 && timeInMinutes <= 21 * 60 ? 'Open' : 'Closed',
    },
    asiaPacific: {
      // Asian markets: ~0:00-7:00 UTC (varies by country)
      open: timeInMinutes >= 0 && timeInMinutes <= 7 * 60,
      status: timeInMinutes >= 0 && timeInMinutes <= 7 * 60 ? 'Open' : 'Closed',
    },
  };
};

export default {
  getIndicesQuotes,
  getIndexHistory,
  getMarketStatus,
  WORLD_INDICES,
};
