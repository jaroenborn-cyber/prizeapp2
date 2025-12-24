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
 * Get constituents (companies) of an index using dedicated API endpoints
 */
export const getIndexConstituents = async (symbol) => {
  try {
    // Map index symbols to FMP constituent endpoints
    const constituentsMap = {
      '^GSPC': 'sp500-constituent',      // S&P 500
      '^IXIC': 'nasdaq-constituent',     // NASDAQ
      '^DJI': 'dow-jones-constituent',   // Dow Jones (if available)
    };
    
    const endpoint = constituentsMap[symbol];
    if (!endpoint) {
      console.warn(`No constituents API available for index ${symbol}`);
      return [];
    }
    
    const response = await fetch(
      `${FMP_BASE_URL}/${endpoint}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      console.error(`API error ${response.status} for endpoint: ${endpoint}`);
      return [];
    }
    
    const data = await response.json();
    
    // The API returns an array of constituents with symbol, name, sector, etc.
    // We'll fetch the quotes for these symbols
    if (Array.isArray(data) && data.length > 0) {
      const symbols = data.slice(0, 50).map(item => item.symbol).filter(Boolean);
      if (symbols.length > 0) {
        return await getStockQuotes(symbols);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching index constituents:', error);
    return [];
  }
};

/**
 * Get quotes for a list of stock symbols
 */
export const getStockQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];
  
  try {
    // FMP API allows up to 250 symbols per request
    const symbolString = symbols.slice(0, 250).join(',');
    const response = await fetch(
      `${FMP_BASE_URL}/quote/${symbolString}?apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('API response not ok:', response.status, response.statusText);
      throw new Error(`Failed to fetch stock quotes: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter out any null or invalid results
    const validResults = Array.isArray(data) ? data.filter(item => item && item.symbol) : [];
    
    if (validResults.length === 0) {
      console.warn(`No valid data returned for symbols: ${symbolString}`);
    }
    
    return validResults;
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    return [];
  }
};

/**
 * Get top stocks for an index (fallback if constituents API doesn't work)
 */
export const getIndexTopStocks = async (indexSymbol) => {
  // Predefined top stocks for major indices using US ticker symbols
  // These are the major companies in each index
  const indexStocks = {
    // US Indices
    '^GSPC': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BERKB', 'JPM', 'V',
              'JNJ', 'WMT', 'PG', 'XOM', 'NFLX', 'ADBE', 'CRM', 'PEP', 'MCD', 'ABT',
              'LLY', 'BA', 'CSCO', 'INTC', 'CVX', 'ACN', 'VRTX', 'NKE', 'GS', 'CMCSA'],
    '^DJI': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BERKB', 'JPM', 'JNJ', 'V', 'XOM',
             'WMT', 'PG', 'UNH', 'MCD', 'GS', 'AXP', 'IBM', 'CAT', 'INTC', 'BA',
             'DD', 'MMM', 'CVX', 'CRM', 'MRK', 'NKE', 'PFE', 'PM', 'RTX', 'TRV'],
    '^IXIC': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'NFLX', 'PYPL',
              'CSCO', 'AMD', 'ADBE', 'CMCSA', 'PEP', 'QCOM', 'ASML', 'TXN', 'INTU', 'AMGN',
              'GILD', 'LRCX', 'BKNG', 'AMAT', 'ADP', 'ABNB', 'MCHP', 'IDXX', 'CRWD', 'MU'],
    
    // European Indices (US-listed versions where available)
    '^AEX': ['ASML', 'SHELL', 'UNILEVER', 'RELX', 'ING', 'PHIA', 'PROSIEBENSAT', 'MERCK', 'ADIDAS', 'BASF',
             'SAP', 'SIEMENS', 'ALLIANZ', 'BMW', 'BAYER', 'HEINEKEN', 'RECKITT', 'BARC', 'HSBC', 'BP'],
    '^GDAXI': ['SAP', 'SIEMENS', 'ALLIANZ', 'BMW', 'BASF', 'BAYER', 'DEUTSCHE', 'INFINEON', 'MERCK', 'VONOVIA',
               'DAIMLER', 'LINDE', 'ADIDAS', 'BEIERSDORF', 'QIAGEN', 'FRAPORT', 'COVESTRO', 'DELIVERY', 'SARTORIUS', 'BRENNTAG'],
    '^FTSE': ['UNILEVER', 'HSBC', 'SHELL', 'ASTRAZENECA', 'GSK', 'BP', 'RECKITT', 'RELX', 'DIAGEO', 'INTERBREW',
              'EXPERIAN', 'RENTOKIL', 'RIO', 'GLENCORE', 'PRUDENTIAL', 'BARC', 'CRODA', 'SMURFIT', 'HALEON', 'PEARSON'],
    '^FCHI': ['LVMH', 'TOTALENERGIES', 'SANOFI', 'ASML', 'DAIMLER', 'HERMES', 'SAFRAN', 'STELLANTIS', 'CAP', 'EDF',
              'AIRBUS', 'DANONE', 'KERING', 'TELECOM', 'PUBLICIS', 'ARCELOR', 'RENAULT', 'ALCATEL', 'VALEO', 'PERNOD'],
    
    // Asian Indices (using US-listed companies where possible)
    '^N225': ['TOYOTA', 'SONY', 'SOFTBANK', 'NOMURA', 'HITACHI', 'MITSUBISHI', 'PANASONIC', 'NIPPON', 'KAWASAKI', 'SUMITOMO',
              'ITOCHU', 'MITSUI', 'MARUBENI', 'TOKYO', 'FANAC', 'DAIWA', 'YAMAHA', 'BRIDGESTONE', 'ASAHI', 'TAKEDA'],
    '^HSI': ['TENCENT', 'ALIBABA', 'ICBC', 'CCB', 'ABC', 'BOC', 'MOBILECOM', 'CLP', 'POWER', 'PETROCHINA',
             'SINOPEC', 'COSCO', 'VANKE', 'ZHAOJIN', 'SWIRE', 'SANDS', 'MACAU', 'LYG', 'CITIC', 'PING'],
  };
  
  const stocks = indexStocks[indexSymbol] || [];
  if (stocks.length === 0) {
    console.warn(`No predefined stocks for index ${indexSymbol}`);
    return [];
  }
  
  try {
    const results = await getStockQuotes(stocks);
    return results;
  } catch (error) {
    console.error(`Error fetching stocks for ${indexSymbol}:`, error);
    return [];
  }
};


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
  getIndexConstituents,
  getStockQuotes,
  getIndexTopStocks,
  WORLD_INDICES,
};
