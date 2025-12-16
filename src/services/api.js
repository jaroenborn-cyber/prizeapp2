import axios from 'axios';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const EXCHANGE_RATE_BASE_URL = 'https://api.exchangerate-api.com/v4/latest';

// CoinGecko API functions
export const getTopCryptos = async (limit = 10) => {
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
    throw error;
  }
};

export const getCryptoDetails = async (coinId) => {
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
    throw error;
  }
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
  try {
    const response = await axios.get(`${EXCHANGE_RATE_BASE_URL}/${baseCurrency}`);
    return response.data.rates;
  } catch (error) {
    console.error('Error fetching fiat rates:', error);
    throw error;
  }
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
