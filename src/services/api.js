import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const EXCHANGE_RATE_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache = {
  topCryptos: { data: null, timestamp: null },
  fiatRates: {},
  cryptoDetails: {},
  historicalData: {}
};

// Function to clear cache (useful for debugging)
export const clearCache = () => {
  cache.topCryptos = { data: null, timestamp: null };
  cache.fiatRates = {};
  cache.cryptoDetails = {};
  cache.historicalData = {};
  console.log('Cache cleared');
};

// Helper function to check if cache is still valid
const isCacheValid = (timestamp) => {
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get from cache or fetch
const getCachedOrFetch = async (cacheKey, fetchFunction, ...args) => {
  const cacheEntry = cache[cacheKey];
  
  if (cacheEntry && isCacheValid(cacheEntry.timestamp)) {
    console.log(`Using cached data for ${cacheKey}`);
    return cacheEntry.data;
  }
  
  console.log(`Fetching fresh data for ${cacheKey}`);
  const data = await fetchFunction(...args);
  cache[cacheKey] = { data, timestamp: Date.now() };
  return data;
};

// CoinGecko API functions
export const getTopCryptos = async (limit = 10) => {
  const fetchFunction = async () => {
    try {
      const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: true,
          price_change_percentage: '24h,7d'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching top cryptos:', error);
      // If API fails and we have cached data, return it even if expired
      if (cache.topCryptos.data) {
        console.log('API failed, using stale cache');
        return cache.topCryptos.data;
      }
      throw error;
    }
  };
  
  return getCachedOrFetch('topCryptos', fetchFunction);
};

export const getCryptoDetails = async (coinId) => {
  const cacheKey = `cryptoDetails_${coinId}`;
  
  const fetchFunction = async () => {
    try {
      const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
        params: {
          localization: false,
          tickers: false,
          community_data: false,
          developer_data: false,
          sparkline: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching crypto details:', error);
      // If API fails and we have cached data, return it even if expired
      if (cache.cryptoDetails[coinId]) {
        console.log(`API failed, using stale cache for ${coinId}`);
        return cache.cryptoDetails[coinId].data;
      }
      throw error;
    }
  };
  
  // Check if we have valid cached data for this specific coin
  const cachedEntry = cache.cryptoDetails[coinId];
  if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
    console.log(`Using cached data for crypto details: ${coinId}`);
    return cachedEntry.data;
  }
  
  console.log(`Fetching fresh data for crypto details: ${coinId}`);
  const data = await fetchFunction();
  cache.cryptoDetails[coinId] = { data, timestamp: Date.now() };
  return data;
};

export const getHistoricalData = async (coinId, days = '7') => {
  const cacheKey = `historicalData_${coinId}_${days}`;
  
  const fetchFunction = async () => {
    try {
      // Determine the interval based on the days parameter
      let interval = 'daily';
      if (days === '1') {
        interval = 'hourly';
      }
      
      console.log(`Fetching chart data for ${coinId}: ${days} days with ${interval} interval`);
      
      const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days: days,
          interval: interval
        }
      });
      
      console.log(`Received ${response.data.prices.length} data points for ${days} days chart`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // If API fails and we have cached data, return it even if expired
      if (cache.historicalData[cacheKey]) {
        console.log(`API failed, using stale cache for historical data: ${coinId}`);
        return cache.historicalData[cacheKey].data;
      }
      throw error;
    }
  };
  
  // Check if we have valid cached data
  const cachedEntry = cache.historicalData[cacheKey];
  if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
    console.log(`Using cached data for historical data: ${coinId} (${days} days)`);
    return cachedEntry.data;
  }
  
  console.log(`Fetching fresh historical data: ${coinId} (${days} days)`);
  const data = await fetchFunction();
  cache.historicalData[cacheKey] = { data, timestamp: Date.now() };
  return data;
};

export const searchCrypto = async (query) => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/search`, {
      params: { query }
    });
    return response.data.coins;
  } catch (error) {
    console.error('Error searching crypto:', error);
    throw error;
  }
};

export const getCryptoPrice = async (coinId, vsCurrency = 'usd') => {
  try {
    const response = await axios.get(`${COINGECKO_BASE_URL}/simple/price`, {
      params: {
        ids: coinId,
        vs_currencies: vsCurrency
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching crypto price:', error);
    throw error;
  }
};

// Fiat Exchange Rate API functions
export const getFiatRates = async (baseCurrency = 'USD') => {
  const cacheKey = `fiatRates_${baseCurrency}`;
  
  const fetchFunction = async () => {
    try {
      const response = await axios.get(`${EXCHANGE_RATE_BASE_URL}/${baseCurrency}`);
      return response.data.rates;
    } catch (error) {
      console.error('Error fetching fiat rates:', error);
      // If API fails and we have cached data, return it even if expired
      if (cache.fiatRates[baseCurrency]) {
        console.log(`API failed, using stale cache for fiat rates: ${baseCurrency}`);
        return cache.fiatRates[baseCurrency].data;
      }
      throw error;
    }
  };
  
  // Check if we have valid cached data for this currency
  const cachedEntry = cache.fiatRates[baseCurrency];
  if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
    console.log(`Using cached data for fiat rates: ${baseCurrency}`);
    return cachedEntry.data;
  }
  
  console.log(`Fetching fresh data for fiat rates: ${baseCurrency}`);
  const data = await fetchFunction();
  cache.fiatRates[baseCurrency] = { data, timestamp: Date.now() };
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
