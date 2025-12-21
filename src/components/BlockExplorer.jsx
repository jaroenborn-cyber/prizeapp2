import { useState, useEffect } from 'react';
import { 
  getBlockchainStats, 
  getRecentBlocks, 
  getRecommendedFees, 
  getMempoolInfo,
  searchBlockchain 
} from '../services/mempool';

const BlockExplorer = () => {
  const [stats, setStats] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [fees, setFees] = useState(null);
  const [mempoolInfo, setMempoolInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, blocksData, feesData, mempoolData] = await Promise.all([
        getBlockchainStats(),
        getRecentBlocks(8),
        getRecommendedFees(),
        getMempoolInfo()
      ]);
      
      setStats(statsData);
      setBlocks(blocksData);
      setFees(feesData);
      setMempoolInfo(mempoolData);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const result = await searchBlockchain(searchQuery.trim());
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({ type: 'error', data: null });
    } finally {
      setSearching(false);
    }
  };

  const formatHashrate = (hashrate) => {
    if (!hashrate?.currentHashrate) return 'N/A';
    const eh = hashrate.currentHashrate / 1e18;
    return `${eh.toFixed(2)} EH/s`;
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('nl-NL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBytes = (bytes) => {
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-400 dark:text-slate-400 light:text-slate-600">
          Loading blockchain data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-slate-900 to-dark-bg dark:from-dark-bg dark:via-slate-900 dark:to-dark-bg light:from-slate-50 light:via-white light:to-slate-50 high-contrast:from-white high-contrast:to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            Bitcoin Block Explorer
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600">
            Real-time Bitcoin blockchain data powered by mempool.space
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search address, transaction or block..."
              className="flex-1 px-4 py-3 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black text-white dark:text-white light:text-slate-800 high-contrast:text-black placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
          
          {searchResult && (
            <div className="mt-4 p-4 bg-dark-card dark:bg-dark-card light:bg-white rounded-lg border border-slate-700 dark:border-slate-700 light:border-slate-300">
              {searchResult.type === 'not_found' && (
                <p className="text-red-400">No results found for "{searchQuery}"</p>
              )}
              {searchResult.type === 'error' && (
                <p className="text-red-400">Error searching. Please try again.</p>
              )}
              {searchResult.type === 'transaction' && (
                <p className="text-green-400">Transaction found! Opening mempool.space...</p>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <div className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">Block Height</div>
            <div className="text-3xl font-bold text-orange-500">
              {stats?.blockHeight?.toLocaleString()}
            </div>
          </div>

          <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <div className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">Network Hashrate</div>
            <div className="text-3xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
              {formatHashrate(stats?.hashrate)}
            </div>
          </div>

          <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <div className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">Mempool Size</div>
            <div className="text-3xl font-bold text-blue-400">
              {mempoolInfo?.count?.toLocaleString() || 'N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {formatBytes(mempoolInfo?.vsize || 0)}
            </div>
          </div>

          <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <div className="text-slate-400 dark:text-slate-400 light:text-slate-600 text-sm mb-2">Next Difficulty</div>
            <div className="text-3xl font-bold text-purple-400">
              {stats?.difficulty?.remainingBlocks || 'N/A'}
            </div>
            <div className="text-xs text-slate-500 mt-1">blocks remaining</div>
          </div>
        </div>

        {/* Fees */}
        {fees && (
          <div className="mb-8 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl p-6 border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <h2 className="text-xl font-bold mb-4 text-white dark:text-white light:text-slate-800 high-contrast:text-black">
              Recommended Fees
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-lg">
                <div className="text-green-400 text-sm mb-1">Low Priority</div>
                <div className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                  {fees.hourFee} sat/vB
                </div>
                <div className="text-xs text-slate-500 mt-1">~1 hour</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-lg">
                <div className="text-yellow-400 text-sm mb-1">Medium Priority</div>
                <div className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                  {fees.halfHourFee} sat/vB
                </div>
                <div className="text-xs text-slate-500 mt-1">~30 min</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-lg">
                <div className="text-red-400 text-sm mb-1">High Priority</div>
                <div className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                  {fees.fastestFee} sat/vB
                </div>
                <div className="text-xs text-slate-500 mt-1">Next block</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Blocks */}
        <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black overflow-hidden">
          <div className="p-6 border-b border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
              Recent Blocks
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Height</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Transactions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase">Miner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 dark:divide-slate-700 light:divide-slate-300 high-contrast:divide-black">
                {blocks.map((block) => (
                  <tr key={block.id} className="hover:bg-slate-800/30 dark:hover:bg-slate-800/30 light:hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-mono text-orange-500">
                      {block.height}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 dark:text-slate-300 light:text-slate-700">
                      {formatDate(block.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white dark:text-white light:text-slate-800">
                      {block.tx_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
                      {formatBytes(block.size)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 dark:text-slate-400 light:text-slate-600">
                      {block.extras?.pool?.name || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-500">
          <p>
            Data provided by{' '}
            <a 
              href="https://mempool.space" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-500 hover:text-orange-600"
            >
              mempool.space
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockExplorer;
