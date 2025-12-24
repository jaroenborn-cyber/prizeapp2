import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIndexTopStocks, WORLD_INDICES } from '../services/stockmarket';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const IndexDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('change'); // change, price, name

  // Find index info from symbol
  const indexInfo = WORLD_INDICES.find(i => i.symbol === symbol);

  useEffect(() => {
    fetchStocks();
  }, [symbol]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIndexTopStocks(symbol);
      setStocks(data);
    } catch (err) {
      console.error('Error fetching stocks:', err);
      setError('Failed to load stocks');
    } finally {
      setLoading(false);
    }
  };

  const getSortedStocks = () => {
    const sorted = [...stocks];
    switch (sortBy) {
      case 'change':
        return sorted.sort((a, b) => (b.changesPercentage || 0) - (a.changesPercentage || 0));
      case 'price':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name':
        return sorted.sort((a, b) => (a.symbol || '').localeCompare(b.symbol || ''));
      default:
        return sorted;
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '—';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatLargeNumber = (num) => {
    if (!num) return '—';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(0)}`;
  };

  if (!indexInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-500">{t.indexNotFound || 'Index not found'}</p>
        <button
          onClick={() => navigate('/market-monitor')}
          className="mt-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
        >
          {t.backToMarketMonitor || 'Back to Market Monitor'}
        </button>
      </div>
    );
  }

  const sortedStocks = getSortedStocks();

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/market-monitor')}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {t.back || 'Back'}
        </button>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{indexInfo.flag}</span>
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
              {indexInfo.name}
            </h1>
            <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">
              {indexInfo.country}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">
            {stocks.length} {t.companiesListed || 'companies listed'}
          </div>
          <button
            onClick={fetchStocks}
            className="px-3 py-1 bg-slate-700/50 hover:bg-slate-600 rounded text-sm text-slate-300 transition"
          >
            🔄 {t.refresh || 'Refresh'}
          </button>
        </div>
      </div>

      {/* Sort Controls */}
      {stocks.length > 0 && (
        <div className="mb-6 flex gap-2">
          <label className="text-sm text-slate-400">{t.sortBy || 'Sort by'}:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-sm text-white cursor-pointer hover:border-slate-600 transition"
          >
            <option value="change">{t.dayChange || 'Daily Change'}</option>
            <option value="price">{t.price || 'Price'}</option>
            <option value="name">{t.symbol || 'Symbol'}</option>
          </select>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Stocks Grid */}
      {!loading && stocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedStocks.map((stock) => {
            const isPositive = (stock.changesPercentage || 0) >= 0;
            const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
            const bgGradient = isPositive 
              ? 'from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-500/50' 
              : 'from-red-500/10 to-red-600/5 border-red-500/30 hover:border-red-500/50';

            return (
              <div
                key={stock.symbol}
                className={`bg-gradient-to-br ${bgGradient} border rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black text-lg">
                      {stock.symbol}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-600 mt-1">
                      {stock.companyName || '—'}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 ${changeColor}`}>
                    {isPositive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                      {formatNumber(stock.price)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${changeColor}`}>
                      {isPositive ? '+' : ''}{formatNumber(stock.changesPercentage)}%
                    </span>
                    <span className={`text-xs ${changeColor}`}>
                      {isPositive ? '+' : ''}{formatNumber(stock.change)}
                    </span>
                  </div>

                  {stock.marketCap && (
                    <div className="pt-2 border-t border-slate-700/50 dark:border-slate-700/50 light:border-slate-200 high-contrast:border-gray-400">
                      <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-600">
                        {t.marketCap || 'Market Cap'}: {formatLargeNumber(stock.marketCap)}
                      </p>
                    </div>
                  )}

                  {stock.pe && (
                    <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-600">
                      P/E: {formatNumber(stock.pe, 1)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && stocks.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-4">
            {t.noStocksFound || 'No stocks found for this index'}
          </p>
          <button
            onClick={fetchStocks}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition"
          >
            {t.tryAgain || 'Try Again'}
          </button>
        </div>
      )}
    </div>
  );
};

export default IndexDetail;
