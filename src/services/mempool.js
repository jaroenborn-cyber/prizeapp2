import axios from 'axios';

const MEMPOOL_BASE_URL = 'https://mempool.space/api';

// Cache configuration
const CACHE_DURATION = 30 * 1000; // 30 seconds for blockchain data
const cache = {
  stats: { data: null, timestamp: null },
  blocks: { data: null, timestamp: null },
  fees: { data: null, timestamp: null },
  difficulty: { data: null, timestamp: null }
};

// Helper function to check if cache is still valid
const isCacheValid = (timestamp) => {
  if (!timestamp) return false;
  return Date.now() - timestamp < CACHE_DURATION;
};

// Get blockchain statistics
export const getBlockchainStats = async () => {
  if (cache.stats.data && isCacheValid(cache.stats.timestamp)) {
    console.log('Using cached blockchain stats');
    return cache.stats.data;
  }

  try {
    const response = await axios.get(`${MEMPOOL_BASE_URL}/blocks/tip/height`);
    const height = response.data;
    
    // Get additional stats
    const [hashrate, difficulty] = await Promise.all([
      axios.get(`${MEMPOOL_BASE_URL}/v1/mining/hashrate/3d`),
      axios.get(`${MEMPOOL_BASE_URL}/v1/difficulty-adjustment`)
    ]);

    const stats = {
      blockHeight: height,
      hashrate: hashrate.data,
      difficulty: difficulty.data
    };

    cache.stats = { data: stats, timestamp: Date.now() };
    return stats;
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    if (cache.stats.data) return cache.stats.data;
    throw error;
  }
};

// Get recent blocks
export const getRecentBlocks = async (limit = 10) => {
  if (cache.blocks.data && isCacheValid(cache.blocks.timestamp)) {
    console.log('Using cached recent blocks');
    return cache.blocks.data;
  }

  try {
    const response = await axios.get(`${MEMPOOL_BASE_URL}/v1/blocks`);
    const blocks = response.data.slice(0, limit);
    
    cache.blocks = { data: blocks, timestamp: Date.now() };
    return blocks;
  } catch (error) {
    console.error('Error fetching recent blocks:', error);
    if (cache.blocks.data) return cache.blocks.data;
    throw error;
  }
};

// Get recommended fees
export const getRecommendedFees = async () => {
  if (cache.fees.data && isCacheValid(cache.fees.timestamp)) {
    console.log('Using cached fee recommendations');
    return cache.fees.data;
  }

  try {
    const response = await axios.get(`${MEMPOOL_BASE_URL}/v1/fees/recommended`);
    cache.fees = { data: response.data, timestamp: Date.now() };
    return response.data;
  } catch (error) {
    console.error('Error fetching recommended fees:', error);
    if (cache.fees.data) return cache.fees.data;
    throw error;
  }
};

// Get mempool info
export const getMempoolInfo = async () => {
  try {
    const response = await axios.get(`${MEMPOOL_BASE_URL}/mempool`);
    return response.data;
  } catch (error) {
    console.error('Error fetching mempool info:', error);
    throw error;
  }
};

// Search for address, transaction, or block
export const searchBlockchain = async (query) => {
  try {
    // Try as transaction first
    try {
      const txResponse = await axios.get(`${MEMPOOL_BASE_URL}/tx/${query}`);
      return { type: 'transaction', data: txResponse.data };
    } catch (e) {
      // Not a transaction, continue
    }

    // Try as address
    try {
      const addressResponse = await axios.get(`${MEMPOOL_BASE_URL}/address/${query}`);
      return { type: 'address', data: addressResponse.data };
    } catch (e) {
      // Not an address, continue
    }

    // Try as block hash or height
    try {
      const blockResponse = await axios.get(`${MEMPOOL_BASE_URL}/block/${query}`);
      return { type: 'block', data: blockResponse.data };
    } catch (e) {
      // Not found
    }

    return { type: 'not_found', data: null };
  } catch (error) {
    console.error('Error searching blockchain:', error);
    throw error;
  }
};

// Get address transactions
export const getAddressTransactions = async (address) => {
  try {
    const response = await axios.get(`${MEMPOOL_BASE_URL}/address/${address}/txs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching address transactions:', error);
    throw error;
  }
};

// Clear cache (useful for debugging)
export const clearMempoolCache = () => {
  cache.stats = { data: null, timestamp: null };
  cache.blocks = { data: null, timestamp: null };
  cache.fees = { data: null, timestamp: null };
  cache.difficulty = { data: null, timestamp: null };
  console.log('Mempool cache cleared');
};
