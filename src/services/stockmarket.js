// Marketstack API for stock market data
const MARKETSTACK_API_KEY = '9329db45a6a7d78855988c64aba86f0c';
const MARKETSTACK_URL = 'http://api.marketstack.com/v1';

// Legacy FMP API (keeping for reference)
const FMP_API_KEY = '5CUgTXPkdfQfArsKbd6qDdSzhz22bN8l';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Major world indices with their symbols (Marketstack uses .INDX suffix)
export const WORLD_INDICES = [
  // Europe
  { symbol: 'AEX.INDX', name: 'AEX', country: 'Netherlands', flag: '🇳🇱', region: 'Europe' },
  { symbol: 'GDAXI.INDX', name: 'DAX', country: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { symbol: 'FTSE.INDX', name: 'FTSE 100', country: 'UK', flag: '🇬🇧', region: 'Europe' },
  { symbol: 'FCHI.INDX', name: 'CAC 40', country: 'France', flag: '🇫🇷', region: 'Europe' },
  { symbol: 'SX5E.INDX', name: 'Euro Stoxx 50', country: 'Europe', flag: '🇪🇺', region: 'Europe' },
  
  // Americas
  { symbol: 'GSPC.INDX', name: 'S&P 500', country: 'USA', flag: '🇺🇸', region: 'Americas' },
  { symbol: 'DJI.INDX', name: 'Dow Jones', country: 'USA', flag: '🇺🇸', region: 'Americas' },
  { symbol: 'IXIC.INDX', name: 'NASDAQ', country: 'USA', flag: '🇺🇸', region: 'Americas' },
  
  // Asia-Pacific
  { symbol: 'N225.INDX', name: 'Nikkei 225', country: 'Japan', flag: '🇯🇵', region: 'Asia-Pacific' },
  { symbol: 'HSI.INDX', name: 'Hang Seng', country: 'Hong Kong', flag: '🇭🇰', region: 'Asia-Pacific' },
  { symbol: 'SSEC.INDX', name: 'SSE Composite', country: 'China', flag: '🇨🇳', region: 'Asia-Pacific' },
  { symbol: 'AXJO.INDX', name: 'ASX 200', country: 'Australia', flag: '🇦🇺', region: 'Asia-Pacific' },
];

// Cache for API responses
let indicesCache = {
  data: null,
  timestamp: null,
  ttl: 60000, // 1 minute cache
};

/**
 * Get quotes for all major indices using Marketstack
 */
export const getIndicesQuotes = async () => {
  // Check cache first
  if (indicesCache.data && indicesCache.timestamp && 
      Date.now() - indicesCache.timestamp < indicesCache.ttl) {
    return indicesCache.data;
  }

  try {
    // Fetch quotes for all indices using Marketstack
    const symbols = WORLD_INDICES.map(i => i.symbol).join(',');
    const response = await fetch(
      `${MARKETSTACK_URL}/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${symbols}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch indices data');
    }
    
    const result = await response.json();
    
    // Check for API error
    if (result.error) {
      console.error('Marketstack indices error:', result.error.message);
      throw new Error(result.error.message);
    }
    
    const data = result.data || [];
    
    // Merge API data with our index info
    const enrichedData = WORLD_INDICES.map(index => {
      const quote = data.find(q => q.symbol === index.symbol);
      const change = quote ? (quote.close - quote.open) : 0;
      const changePercent = quote && quote.open ? ((change / quote.open) * 100) : 0;
      
      return {
        ...index,
        price: quote?.close || null,
        change: change,
        changesPercentage: changePercent,
        dayHigh: quote?.high || null,
        dayLow: quote?.low || null,
        previousClose: quote?.adj_close || null,
        open: quote?.open || null,
        volume: quote?.volume || null,
        timestamp: quote?.date || null,
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
 * Get quotes for a list of stock symbols using Marketstack API
 */
export const getStockQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];
  
  try {
    // Marketstack supports batch requests - up to 100 symbols at once
    const symbolString = symbols.slice(0, 100).join(',');
    
    const response = await fetch(
      `${MARKETSTACK_URL}/eod/latest?access_key=${MARKETSTACK_API_KEY}&symbols=${symbolString}`
    );
    
    if (!response.ok) {
      console.error('Marketstack API error:', response.status);
      return [];
    }
    
    const result = await response.json();
    
    // Check for API error
    if (result.error) {
      console.error('Marketstack error:', result.error.message);
      return [];
    }
    
    // Format the data to our expected format
    if (result.data && Array.isArray(result.data)) {
      return result.data.map(formatMarketstackQuote);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching stock quotes:', error);
    return [];
  }
};

// Company name mappings for common stocks
const COMPANY_NAMES = {
  // US Tech Giants
  'AAPL': 'Apple Inc.',
  'MSFT': 'Microsoft',
  'GOOGL': 'Alphabet (Google)',
  'AMZN': 'Amazon',
  'META': 'Meta (Facebook)',
  'NVDA': 'NVIDIA',
  'TSLA': 'Tesla',
  'NFLX': 'Netflix',
  'ADBE': 'Adobe',
  'CRM': 'Salesforce',
  'INTC': 'Intel',
  'AMD': 'AMD',
  'CSCO': 'Cisco',
  'ORCL': 'Oracle',
  'IBM': 'IBM',
  'PYPL': 'PayPal',
  'AVGO': 'Broadcom',
  'QCOM': 'Qualcomm',
  'TXN': 'Texas Instruments',
  'INTU': 'Intuit',
  'ASML': 'ASML',
  'AMAT': 'Applied Materials',
  'LRCX': 'Lam Research',
  'MU': 'Micron',
  'MCHP': 'Microchip',
  'CRWD': 'CrowdStrike',
  'ABNB': 'Airbnb',
  'BKNG': 'Booking.com',
  'ADP': 'ADP',
  'IDXX': 'IDEXX Labs',
  'GILD': 'Gilead Sciences',
  'AMGN': 'Amgen',
  
  // US Blue Chips
  'JPM': 'JPMorgan Chase',
  'V': 'Visa',
  'MA': 'Mastercard',
  'JNJ': 'Johnson & Johnson',
  'WMT': 'Walmart',
  'PG': 'Procter & Gamble',
  'XOM': 'Exxon Mobil',
  'CVX': 'Chevron',
  'HD': 'Home Depot',
  'KO': 'Coca-Cola',
  'PEP': 'PepsiCo',
  'MCD': 'McDonalds',
  'NKE': 'Nike',
  'DIS': 'Disney',
  'ABT': 'Abbott Labs',
  'LLY': 'Eli Lilly',
  'UNH': 'UnitedHealth',
  'MRK': 'Merck',
  'PFE': 'Pfizer',
  'BA': 'Boeing',
  'CAT': 'Caterpillar',
  'GS': 'Goldman Sachs',
  'AXP': 'American Express',
  'MMM': '3M',
  'DOW': 'Dow Inc.',
  'TRV': 'Travelers',
  'RTX': 'RTX Corp',
  'PM': 'Philip Morris',
  'ACN': 'Accenture',
  'VRTX': 'Vertex Pharma',
  'CMCSA': 'Comcast',
  'BRK.B': 'Berkshire Hathaway',
  
  // AEX (Dutch stocks)
  'ADYEN': 'Adyen',
  'PROSUS': 'Prosus',
  'UNA': 'Unilever',
  'INGA': 'ING Groep',
  'ABN': 'ABN AMRO',
  'KPN': 'KPN',
  'RAND': 'Randstad',
  'HEIA': 'Heineken',
  'WKL': 'Wolters Kluwer',
  'PHIA': 'Philips',
  'ASM': 'ASM International',
  'NN': 'NN Group',
  'AKZA': 'Akzo Nobel',
  'AD': 'Ahold Delhaize',
  'AGN': 'Aegon',
  'DSM': 'DSM',
  'BESI': 'BE Semiconductor',
  'IMCD': 'IMCD',
  'JDE': 'JDE Peet\'s',
  'UMG': 'Universal Music',
  'GLPG': 'Galapagos',
  'TKWY': 'Just Eat Takeaway',
  
  // European (US-listed)
  'UL': 'Unilever',
  'SHELL': 'Shell',
  'BP': 'BP',
  'HSBC': 'HSBC',
  'AZN': 'AstraZeneca',
  'GSK': 'GSK',
  'DEO': 'Diageo',
  'BUD': 'AB InBev',
  'SAP': 'SAP',
  'SNY': 'Sanofi',
  'TTE': 'TotalEnergies',
  'STLA': 'Stellantis',
  'ING': 'ING Group',
  'RELX': 'RELX',
  'MT': 'ArcelorMittal',
  'DB': 'Deutsche Bank',
  'BCS': 'Barclays',
  'RIO': 'Rio Tinto',
  'LIN': 'Linde',
  
  // Asian (US-listed)
  'TM': 'Toyota',
  'SONY': 'Sony',
  'BABA': 'Alibaba',
  'NMR': 'Nomura',
  'TAK': 'Takeda',
  'LVS': 'Las Vegas Sands',
  'LYG': 'Lloyds Banking',
};

/**
 * Format Marketstack quote to our expected format
 */
const formatMarketstackQuote = (quote) => {
  const change = quote.close - quote.open;
  const changePercent = quote.open ? ((change / quote.open) * 100) : 0;
  
  return {
    symbol: quote.symbol,
    name: COMPANY_NAMES[quote.symbol] || quote.symbol,
    price: quote.close || 0,
    change: change,
    changesPercentage: changePercent,
    dayHigh: quote.high || null,
    dayLow: quote.low || null,
    open: quote.open || null,
    previousClose: quote.adj_close || null,
    volume: quote.volume || null,
    exchange: quote.exchange || null,
  };
};

/**
 * Get top stocks for an index (fallback if constituents API doesn't work)
 */
export const getIndexTopStocks = async (indexSymbol) => {
  // Predefined top stocks for major indices using US ticker symbols
  // These are the major companies in each index
  const indexStocks = {
    // US Indices
    'GSPC.INDX': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'V',
              'JNJ', 'WMT', 'PG', 'XOM', 'NFLX', 'ADBE', 'CRM', 'PEP', 'MCD', 'ABT',
              'LLY', 'BA', 'CSCO', 'INTC', 'CVX', 'ACN', 'VRTX', 'NKE', 'GS', 'CMCSA'],
    'DJI.INDX': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'BRK.B', 'JPM', 'JNJ', 'V', 'XOM',
             'WMT', 'PG', 'UNH', 'MCD', 'GS', 'AXP', 'IBM', 'CAT', 'INTC', 'BA',
             'DOW', 'MMM', 'CVX', 'CRM', 'MRK', 'NKE', 'PFE', 'PM', 'RTX', 'TRV'],
    'IXIC.INDX': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'NFLX', 'PYPL',
              'CSCO', 'AMD', 'ADBE', 'CMCSA', 'PEP', 'QCOM', 'ASML', 'TXN', 'INTU', 'AMGN',
              'GILD', 'LRCX', 'BKNG', 'AMAT', 'ADP', 'ABNB', 'MCHP', 'IDXX', 'CRWD', 'MU'],
    
    // European Indices
    'AEX.INDX': ['ASML', 'SHELL', 'ADYEN', 'PROSUS', 'UNA', 'INGA', 'ABN', 'KPN', 'RAND',
             'HEIA', 'WKL', 'PHIA', 'ASM', 'NN', 'AKZA', 'AD', 'AGN', 'DSM', 'BESI', 'IMCD',
             'ABN', 'JDE', 'UMG', 'GLPG', 'TKWY'],
    'GDAXI.INDX': ['SAP', 'SIEGY', 'ALIZY', 'BMWYY', 'BASFY', 'BAYRY', 'DB', 'IFNNY', 'MKKGY', 'VONOY',
               'DDAIF', 'LIN', 'ADDYY', 'BDRFY', 'QGEN', 'FPRUY', 'CVVTF', 'DLVHF', 'SARTF', 'BNTGF'],
    'FTSE.INDX': ['UL', 'HSBC', 'SHELL', 'AZN', 'GSK', 'BP', 'RBGLY', 'RELX', 'DEO', 'BUD',
              'EXPGY', 'RTOKY', 'RIO', 'GLNCY', 'PUK', 'BCS', 'CRDA', 'SMFKY', 'HLN', 'PSO'],
    'FCHI.INDX': ['LVMUY', 'TTE', 'SNY', 'ASML', 'DDAIF', 'HESAY', 'SAFRY', 'STLA', 'CAP', 'ECIFY',
              'EADSY', 'DANOY', 'PPRUY', 'ORAN', 'PUBGY', 'MT', 'RNLSY', 'ALAVF', 'VLEEF', 'PDRDY'],
    
    // Asian Indices
    'N225.INDX': ['TM', 'SONY', 'SFTBY', 'NMR', 'HTHIY', 'MSBHF', 'PCRFY', 'NPPXF', 'KWHIY', 'SMFNF',
              'ITOCY', 'MITSY', 'MARUY', 'TKOMY', 'FANUY', 'DSEEY', 'YAMCY', 'BRDCY', 'ASBRF', 'TAK'],
    'HSI.INDX': ['TCEHY', 'BABA', 'CICHF', 'CICHY', 'ACGBF', 'BACHF', 'CHL', 'CLPHY', 'CPWLF', 'PTR',
             'SNP', 'CICOY', 'VNNVF', 'ZHAOF', 'SWRAY', 'LVS', 'MPEL', 'LYG', 'CIIHY', 'PNGAY'],
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
