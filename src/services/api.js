import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const EXCHANGE_RATE_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// Rate limiting configuration
const RATE_LIMIT = 2000; // ms between requests (safe: 60000/30 = 2000ms)
let lastRequestTime = 0;

// Rate limiter to prevent hitting API limits
const rateLimiter = async (fn) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT) {
    await new Promise(resolve => 
      setTimeout(resolve, RATE_LIMIT - timeSinceLastRequest)
    );
  }
  
  lastRequestTime = Date.now();
  return fn();
};

// Cache configuration per endpoint
const CACHE_CONFIG = {
  markets: { duration: 300000, maxSize: 100 }, // 5 min
  'simple/price': { duration: 60000, maxSize: 250 }, // 1 min (live updates)
  trending: { duration: 600000, maxSize: 1 }, // 10 min (static)
  details: { duration: 300000, maxSize: 50 }, // 5 min
  historical: { duration: 300000, maxSize: 100 }, // 5 min
  fiatRates: { duration: 300000, maxSize: 10 } // 5 min
};

// Cached API class with smart caching and rate limiting
class CachedAPI {
  constructor() {
    this.cache = new Map();
    // Clear old cache every hour
    setInterval(() => this.clearOldCache(), 3600000);
  }

  async getCachedData(endpoint, params = {}) {
    const cacheKey = `${endpoint}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    const config = CACHE_CONFIG[endpoint.split('/')[0]] || CACHE_CONFIG.markets;
    
    if (cached && Date.now() - cached.timestamp < config.duration) {
      console.log(`Using cached data for ${endpoint}`);
      return cached.data;
    }

    console.log(`Fetching fresh data for ${endpoint}`);
    const data = await rateLimiter(() => 
      axios.get(`${COINGECKO_BASE_URL}/${endpoint}`, { params })
        .then(r => r.data)
        .catch(error => {
          // Return stale cache on error if available
          if (cached) {
            console.log(`API failed, using stale cache for ${endpoint}`);
            return cached.data;
          }
          throw error;
        })
    );

    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    // Enforce max cache size per endpoint type
    this.enforceCacheSize(endpoint.split('/')[0], config.maxSize);
    
    return data;
  }

  enforceCacheSize(endpointType, maxSize) {
    const keys = Array.from(this.cache.keys()).filter(k => k.startsWith(endpointType));
    if (keys.length > maxSize) {
      // Remove oldest entries
      keys
        .sort((a, b) => this.cache.get(a).timestamp - this.cache.get(b).timestamp)
        .slice(0, keys.length - maxSize)
        .forEach(key => this.cache.delete(key));
    }
  }

  clearOldCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > 3600000) { // 1 hour
        this.cache.delete(key);
      }
    }
    console.log('Old cache entries cleared');
  }

  clearCache() {
    this.cache.clear();
    console.log('Cache cleared');
  }
}

const cryptoAPI = new CachedAPI();

// Export clear cache for debugging
export const clearCache = () => cryptoAPI.clearCache();

// CoinGecko API functions
export const getTopCryptos = async (limit = 10) => {
  return cryptoAPI.getCachedData('coins/markets', {
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: limit,
    page: 1,
    sparkline: true,
    price_change_percentage: '24h,7d'
  });
};

export const getCryptoDetails = async (coinId) => {
  return cryptoAPI.getCachedData(`coins/${coinId}`, {
    localization: false,
    tickers: false,
    community_data: false,
    developer_data: false,
    sparkline: true
  });
};

export const getHistoricalData = async (coinId, days = '7') => {
  return cryptoAPI.getCachedData(`coins/${coinId}/market_chart`, {
    vs_currency: 'usd',
    days: days
  });
};

export const searchCrypto = async (query) => {
  return rateLimiter(() => 
    axios.get(`${COINGECKO_BASE_URL}/search`, { params: { query } })
      .then(r => r.data.coins)
  );
};

export const getCryptoPrice = async (coinId, vsCurrency = 'usd') => {
  return cryptoAPI.getCachedData('simple/price', {
    ids: coinId,
    vs_currencies: vsCurrency
  });
};

// Fiat Exchange Rate API functions with rate limiting
export const getFiatRates = async (baseCurrency = 'USD') => {
  const cacheKey = `fiatRates:${baseCurrency}`;
  const cached = cryptoAPI.cache.get(cacheKey);
  const config = CACHE_CONFIG.fiatRates;
  
  if (cached && Date.now() - cached.timestamp < config.duration) {
    return cached.data;
  }

  const data = await rateLimiter(() =>
    axios.get(`${EXCHANGE_RATE_BASE_URL}/${baseCurrency}`)
      .then(r => r.data.rates)
      .catch(error => {
        if (cached) {
          console.log(`Fiat API failed, using stale cache for ${baseCurrency}`);
          return cached.data;
        }
        throw error;
      })
  );

  cryptoAPI.cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

export const convertCurrency = async (amount, from, to, cryptoData) => {
  try {
    // Check if conversion involves crypto
    const fromIsCrypto = cryptoData.find(c => c.symbol.toLowerCase() === from.toLowerCase());
    const toIsCrypto = cryptoData.find(c => c.symbol.toLowerCase() === to.toLowerCase());

    if (fromIsCrypto && toIsCrypto) {
      // Crypto to Crypto
      const fromPrice = fromIsCrypto.current_price;
      const toPrice = toIsCrypto.current_price;
      return (amount * fromPrice) / toPrice;
    } else if (fromIsCrypto) {
      // Crypto to Fiat
      const rates = await getFiatRates(to);
      return amount * fromIsCrypto.current_price;
    } else if (toIsCrypto) {
      // Fiat to Crypto
      return amount / toIsCrypto.current_price;
    } else {
      // Fiat to Fiat
      const rates = await getFiatRates(from);
      return amount * rates[to];
    }
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};
