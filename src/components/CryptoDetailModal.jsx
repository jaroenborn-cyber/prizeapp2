import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { getHistoricalData } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CryptoDetailModal = ({ crypto, onClose, onToggleFavorite, isFavorite, onFullscreen }) => {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('7');
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update timestamp when crypto data changes
  useEffect(() => {
    if (crypto) {
      setLastUpdate(new Date());
    }
  }, [crypto?.current_price, crypto?.price_change_percentage_24h]);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const data = await getHistoricalData(crypto.id, chartPeriod);
        const prices = data.prices || [];
        
        setChartData({
          labels: prices.map(p => {
            const date = new Date(p[0]);
            if (chartPeriod === '1') {
              return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }),
          datasets: [
            {
              label: 'Price (USD)',
              data: prices.map(p => p[1]),
              borderColor: theme === 'high-contrast' ? '#000000' : (theme === 'light' ? '#3b82f6' : '#3b82f6'),
              backgroundColor: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.1)' : (theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)'),
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (crypto) {
      fetchChartData();
      
      // Refresh chart data every 60 seconds
      const interval = setInterval(fetchChartData, 60000);
      return () => clearInterval(interval);
    }
  }, [crypto.id, chartPeriod, theme]);

  if (!crypto) return null;

  const priceChange24h = crypto.price_change_percentage_24h || 0;
  const priceChange7d = crypto.price_change_percentage_7d_in_currency || 0;
  const isPositive24h = priceChange24h >= 0;
  const isPositive7d = priceChange7d >= 0;

  const formatPrice = (price) => {
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const formatMarketCap = (marketCap) => {
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(2)}`;
  };

  const formatVolume = (volume) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 dark:bg-black/70 light:bg-black/50 high-contrast:bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white border-b border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={crypto.image} alt={crypto.name} className="w-16 h-16 rounded-full" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">{crypto.name}</h2>
                {crypto.isLive && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 uppercase">{crypto.symbol}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onFullscreen}
              className="p-2 rounded-full transition-all text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-200 high-contrast:bg-gray-200 hover:text-white dark:hover:text-white light:hover:text-slate-900 high-contrast:hover:text-black hover:bg-slate-600/50 dark:hover:bg-slate-600/50 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300"
              aria-label="Open fullscreen"
              title="Fullscreen mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={() => onToggleFavorite(crypto)}
              className={`p-2 rounded-full transition-all ${
                isFavorite(crypto)
                  ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30'
                  : 'text-slate-500 bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-200 high-contrast:bg-gray-200 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
              aria-label={isFavorite(crypto) ? "Remove from favorites" : "Add to favorites"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 high-contrast:hover:text-black text-3xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Data Source Info */}
          <div className="mb-6 p-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-gray-400">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600">
                  Data: <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800">CoinGecko API</span>
                  {crypto.isLive && (
                    <span className="ml-2">
                      • Live: <span className="font-semibold text-green-400">Binance WebSocket</span>
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600">
                  Updated: <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800">{lastUpdate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">Current Price</p>
              {crypto.isLive && (
                <span className="text-xs text-green-400">(Realtime)</span>
              )}
            </div>
            <p className="text-5xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black mb-4">
              ${formatPrice(crypto.current_price)}
            </p>
            <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-lg ${isPositive24h ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <span className="font-semibold">
                  {isPositive24h ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}% (24h)
                </span>
              </div>
              <div className={`px-4 py-2 rounded-lg ${isPositive7d ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <span className="font-semibold">
                  {isPositive7d ? '▲' : '▼'} {Math.abs(priceChange7d).toFixed(2)}% (7d)
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">Price Chart</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setChartPeriod('1')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '1'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
                  }`}
                >
                  24H
                </button>
                <button
                  onClick={() => setChartPeriod('7')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '7'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
                  }`}
                >
                  7D
                </button>
                <button
                  onClick={() => setChartPeriod('30')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '30'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
                  }`}
                >
                  30D
                </button>
                <button
                  onClick={() => setChartPeriod('365')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    chartPeriod === '365'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
                  }`}
                >
                  1Y
                </button>
              </div>
            </div>
            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4 h-80">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">Loading chart...</div>
                </div>
              ) : chartData ? (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
                        titleColor: theme === 'light' ? '#1e293b' : '#ffffff',
                        bodyColor: theme === 'light' ? '#1e293b' : '#ffffff',
                        borderColor: theme === 'light' ? '#e2e8f0' : '#334155',
                        borderWidth: 1,
                      },
                    },
                    scales: {
                      x: {
                        grid: {
                          color: theme === 'high-contrast' ? '#000000' : (theme === 'light' ? '#e2e8f0' : '#334155'),
                          drawBorder: false,
                        },
                        ticks: {
                          color: theme === 'light' ? '#64748b' : '#94a3b8',
                          maxTicksLimit: 8,
                        },
                      },
                      y: {
                        grid: {
                          color: theme === 'high-contrast' ? '#000000' : (theme === 'light' ? '#e2e8f0' : '#334155'),
                          drawBorder: false,
                        },
                        ticks: {
                          color: theme === 'light' ? '#64748b' : '#94a3b8',
                          callback: function(value) {
                            return '$' + value.toLocaleString();
                          },
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">No chart data available</div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-2">Market Cap</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">{formatMarketCap(crypto.market_cap)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-700 mt-1">Rank #{crypto.market_cap_rank}</p>
            </div>

            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-2">24h Volume</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">{formatVolume(crypto.total_volume)}</p>
            </div>

            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-2">Circulating Supply</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                {crypto.circulating_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-700 mt-1 uppercase">{crypto.symbol}</p>
            </div>

            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-2">24h High</p>
              <p className="text-2xl font-bold text-green-400">${formatPrice(crypto.high_24h)}</p>
            </div>

            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-2">24h Low</p>
              <p className="text-2xl font-bold text-red-400">${formatPrice(crypto.low_24h)}</p>
            </div>

            <div className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl p-4">
              <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mb-2">All-Time High</p>
              <p className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">${formatPrice(crypto.ath)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDetailModal;
