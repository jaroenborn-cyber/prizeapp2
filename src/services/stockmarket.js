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
 * Get constituents (companies) of an index
 */
export const getIndexConstituents = async (symbol) => {
  try {
    const response = await fetch(
      `${FMP_BASE_URL}/etf-holder/${symbol}?limit=50&apikey=${FMP_API_KEY}`
    );
    
    if (!response.ok) {
      // Fallback: try to get the top stocks for the index
      // Some indices might not have direct constituent data
      console.warn(`Could not fetch constituents for ${symbol}`);
      return [];
    }
    
    const data = await response.json();
    return data || [];
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
      throw new Error('Failed to fetch stock quotes');
    }
    
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    return [];
  }
};

/**
 * Get top stocks for an index (fallback if constituents API doesn't work)
 */
export const getIndexTopStocks = async (indexSymbol) => {
  // Predefined top stocks for major indices
  const indexStocks = {
    '^AEX': ['ASML.AS', 'SHELL.AS', 'RELX.AS', 'ING.AS', 'UNVR.AS', 'PHIA.AS', 'UNA.AS', 'NN.AS', 'ADYEN.AS', 'AKZA.AS',
              'REN.AS', 'ABNA.AS', 'IMIX.AS', 'INSI.AS', 'APRA.AS', 'EXAB.AS', 'PROL.AS', 'TRNL.AS', 'HAL.AS', 'FH.AS'],
    '^GDAXI': ['SAP.DE', 'SIE.DE', 'VNA.DE', 'ALV.DE', 'MUV2.DE', 'HNR1.DE', 'BAS.DE', 'BAYN.DE', 'VOW3.DE', 'BMW.DE',
               'DAI.DE', 'LIN.DE', 'MBG.DE', 'ADS.DE', 'DBK.DE', 'DB1.DE', 'QIA.DE', 'MTX.DE', 'WDI.DE', 'ZO2.DE'],
    '^FTSE': ['HSBA.L', 'SHEL.L', 'AZN.L', 'GSK.L', 'UNVR.L', 'BP..L', 'ULVR.L', 'VOD.L', 'EXPN.L', 'TSCO.L',
              'JE.L', 'RELX.L', 'LGEN.L', 'RIO.L', 'DGE.L', 'PRU.L', 'BARC.L', 'HL..L', 'BNZL.L', 'MKS.L'],
  };
  
  const stocks = indexStocks[indexSymbol] || [];
  if (stocks.length === 0) return [];
  
  return getStockQuotes(stocks);
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
