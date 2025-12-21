import { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getHistoricalData } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
);

const FullscreenCrypto = ({ crypto, onClose }) => {
  const { theme, setTheme } = useTheme();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false);
  const [showOpacityMenu, setShowOpacityMenu] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('1');
  const [chartOpacity, setChartOpacity] = useState(0.2);

  // Fetch chart data based on selected period
  useEffect(() => {
    const fetchChartData = async () => {
      if (!crypto) return;
      
      try {
        const data = await getHistoricalData(crypto.id, chartPeriod);
        const prices = data.prices || [];
        
        setChartData({
          labels: prices.map(p => {
            const date = new Date(p[0]);
            if (chartPeriod === '1') {
              return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
            } else if (chartPeriod === '7') {
              return date.toLocaleDateString('nl-NL', { weekday: 'short' });
            } else if (chartPeriod === '30') {
              return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
            } else {
              return date.toLocaleDateString('nl-NL', { month: 'short' });
            }
          }),
          datasets: [
            {
              data: prices.map(p => p[1]),
              borderColor: 'rgba(59, 130, 246, 0.3)',
              backgroundColor: 'rgba(59, 130, 246, 0.05)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointRadius: 0,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching fullscreen chart data:', error);
      }
    };

    fetchChartData();
  }, [crypto?.id, chartPeriod]);

  // Update timestamp when crypto data changes
  useEffect(() => {
    if (crypto) {
      setLastUpdate(new Date());
    }
  }, [crypto?.current_price, crypto?.price_change_percentage_24h]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        if (showThemeMenu) {
          setShowThemeMenu(false);
        } else if (showTimeframeMenu) {
          setShowTimeframeMenu(false);
        } else if (showOpacityMenu) {
          setShowOpacityMenu(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, showThemeMenu, showTimeframeMenu, showOpacityMenu]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showThemeMenu && !e.target.closest('.theme-switcher-container')) {
        setShowThemeMenu(false);
      }
      if (showTimeframeMenu && !e.target.closest('.timeframe-switcher-container')) {
        setShowTimeframeMenu(false);
      }
      if (showOpacityMenu && !e.target.closest('.opacity-switcher-container')) {
        setShowOpacityMenu(false);
      }
    };
    if (showThemeMenu || showTimeframeMenu || showOpacityMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showThemeMenu, showTimeframeMenu, showOpacityMenu]);

  if (!crypto) return null;

  const priceChange = crypto.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 light:from-slate-100 light:via-slate-50 light:to-slate-100 high-contrast:from-white high-contrast:via-gray-50 high-contrast:to-white">
      {/* Background Chart */}
      {chartData && (
        <div className="absolute inset-0" style={{ opacity: chartOpacity }}>
          <div className="w-full h-full p-20">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { enabled: false },
                },
                scales: {
                  x: {
                    display: true,
                    grid: {
                      color: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.1)' : (theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'),
                      drawBorder: true,
                      borderColor: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.2)' : (theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'),
                    },
                    ticks: {
                      color: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.4)' : (theme === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'),
                      maxTicksLimit: 8,
                      font: {
                        size: 10,
                      },
                    },
                  },
                  y: {
                    display: true,
                    position: 'right',
                    grid: {
                      color: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.1)' : (theme === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.1)'),
                      drawBorder: true,
                      borderColor: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.2)' : (theme === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'),
                    },
                    ticks: {
                      color: theme === 'high-contrast' ? 'rgba(0, 0, 0, 0.4)' : (theme === 'light' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.4)'),
                      maxTicksLimit: 6,
                      font: {
                        size: 10,
                      },
                      callback: function(value) {
                        return '$' + value.toLocaleString();
                      },
                    },
                  },
                },
                elements: {
                  point: { radius: 0 },
                },
              }}
            />
          </div>
        </div>
      )}
      {/* Theme Switcher - Top Right */}
      <div className="absolute top-8 right-44 z-10 theme-switcher-container">
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 high-contrast:hover:text-black transition-all hover:bg-slate-700/30 dark:hover:bg-slate-700/30 light:hover:bg-slate-200 high-contrast:hover:bg-gray-200"
            aria-label="Change theme"
          >
            {theme === 'dark' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            {theme === 'light' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
            {theme === 'high-contrast' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>

          {/* Dropdown Menu */}
          {showThemeMenu && (
            <div className="absolute top-12 right-0 w-48 bg-slate-800 dark:bg-slate-800 light:bg-white high-contrast:bg-white rounded-lg shadow-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black overflow-hidden">
              <button
                onClick={() => {
                  setTheme('dark');
                  setShowThemeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-sm font-medium">Donker</span>
              </button>
              <button
                onClick={() => {
                  setTheme('light');
                  setShowThemeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  theme === 'light'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm font-medium">Licht</span>
              </button>
              <button
                onClick={() => {
                  setTheme('high-contrast');
                  setShowThemeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  theme === 'high-contrast'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-medium">Hoog Contrast</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeframe Switcher */}
      <div className="absolute top-8 right-32 z-10 timeframe-switcher-container">
        <div className="relative">
          <button
            onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
            className="p-2 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 high-contrast:hover:text-black transition-all hover:bg-slate-700/30 dark:hover:bg-slate-700/30 light:hover:bg-slate-200 high-contrast:hover:bg-gray-200"
            aria-label="Change timeframe"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showTimeframeMenu && (
            <div className="absolute top-12 right-0 w-36 bg-slate-800 dark:bg-slate-800 light:bg-white high-contrast:bg-white rounded-lg shadow-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black overflow-hidden">
              <button
                onClick={() => {
                  setChartPeriod('1');
                  setShowTimeframeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  chartPeriod === '1'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <span className="text-sm">24 Uur</span>
              </button>
              <button
                onClick={() => {
                  setChartPeriod('7');
                  setShowTimeframeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  chartPeriod === '7'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <span className="text-sm">7 Dagen</span>
              </button>
              <button
                onClick={() => {
                  setChartPeriod('30');
                  setShowTimeframeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  chartPeriod === '30'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <span className="text-sm">30 Dagen</span>
              </button>
              <button
                onClick={() => {
                  setChartPeriod('365');
                  setShowTimeframeMenu(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-slate-700/50 dark:hover:bg-slate-700/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 transition-colors ${
                  chartPeriod === '365'
                    ? 'bg-slate-700/30 text-white dark:text-white light:text-slate-900 high-contrast:text-black font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-700'
                }`}
              >
                <span className="text-sm">1 Jaar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Opacity Switcher */}
      <div className="absolute top-8 right-20 z-10 opacity-switcher-container">
        <div className="relative">
          <button
            onClick={() => setShowOpacityMenu(!showOpacityMenu)}
            className="p-2 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 high-contrast:hover:text-black transition-all hover:bg-slate-700/30 dark:hover:bg-slate-700/30 light:hover:bg-slate-200 high-contrast:hover:bg-gray-200"
            aria-label="Change opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showOpacityMenu && (
            <div className="absolute top-12 right-0 w-48 bg-slate-800 dark:bg-slate-800 light:bg-white high-contrast:bg-white rounded-lg shadow-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black overflow-hidden p-4">
              <label className="text-sm font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800 block mb-2">
                Transparantie: {Math.round(chartOpacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={chartOpacity * 100}
                onChange={(e) => setChartOpacity(e.target.value / 100)}
                className="w-full h-2 bg-slate-700 dark:bg-slate-700 light:bg-slate-300 high-contrast:bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          )}
        </div>
      </div>
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-8 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 high-contrast:hover:text-black transition-all p-2 hover:bg-slate-700/30 dark:hover:bg-slate-700/30 light:hover:bg-slate-200 high-contrast:hover:bg-gray-200 rounded-lg"
        aria-label="Exit fullscreen"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* ESC hint */}
      <div className="absolute top-8 left-8 text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-600 text-sm flex items-center gap-2">
        <kbd className="px-2 py-1 bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-200 high-contrast:bg-gray-200 rounded border border-slate-600 dark:border-slate-600 light:border-slate-300 high-contrast:border-gray-400 text-xs">ESC</kbd>
        <span>to exit</span>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center gap-8 p-8">
        {/* Crypto icon and name */}
        <div className="flex items-center gap-6">
          <img 
            src={crypto.image} 
            alt={crypto.name} 
            className="w-24 h-24 rounded-full shadow-2xl"
          />
          <div>
            <h1 className="text-6xl font-bold text-white dark:text-white light:text-slate-900 high-contrast:text-black">
              {crypto.name}
            </h1>
            <p className="text-3xl text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600 uppercase mt-2">
              {crypto.symbol}
            </p>
          </div>
        </div>

        {/* Live indicator */}
        {crypto.isLive && (
          <div className="flex items-center gap-3 bg-green-500/20 px-6 py-3 rounded-full">
            <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-semibold text-xl">LIVE</span>
          </div>
        )}

        {/* Price - HUGE */}
        <div className="text-center">
          <div className="text-sm text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-600 mb-2 uppercase tracking-wider">
            Current Price
          </div>
          <div className={`text-9xl font-bold tracking-tight ${
            isPositive 
              ? 'text-green-400 dark:text-green-400 light:text-green-600 high-contrast:text-green-700' 
              : 'text-red-400 dark:text-red-400 light:text-red-600 high-contrast:text-red-700'
          }`}>
            ${crypto.current_price?.toLocaleString('en-US', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: crypto.current_price < 1 ? 6 : 2
            })}
          </div>
        </div>

        {/* 24h Change - LARGE */}
        <div className="flex items-center gap-4">
          {isPositive ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <div className="text-center">
            <div className="text-sm text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-600 mb-1 uppercase tracking-wider">
              24h Change
            </div>
            <div className={`text-6xl font-bold ${
              isPositive 
                ? 'text-green-400 dark:text-green-400 light:text-green-600 high-contrast:text-green-700' 
                : 'text-red-400 dark:text-red-400 light:text-red-600 high-contrast:text-red-700'
            }`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Additional stats in smaller text */}
        <div className="grid grid-cols-3 gap-8 mt-8">
          <div className="text-center px-6 py-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-white/50 high-contrast:bg-gray-100 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-gray-400">
            <div className="text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-600 text-sm mb-1">Market Cap</div>
            <div className="text-white dark:text-white light:text-slate-900 high-contrast:text-black text-2xl font-bold">
              ${(crypto.market_cap / 1e9).toFixed(2)}B
            </div>
          </div>
          <div className="text-center px-6 py-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-white/50 high-contrast:bg-gray-100 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-gray-400">
            <div className="text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-600 text-sm mb-1">24h High</div>
            <div className="text-white dark:text-white light:text-slate-900 high-contrast:text-black text-2xl font-bold">
              ${crypto.high_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-center px-6 py-4 bg-slate-800/50 dark:bg-slate-800/50 light:bg-white/50 high-contrast:bg-gray-100 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-gray-400">
            <div className="text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-600 text-sm mb-1">24h Low</div>
            <div className="text-white dark:text-white light:text-slate-900 high-contrast:text-black text-2xl font-bold">
              ${crypto.low_24h?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Data Source Info */}
        <div className="mt-6 px-6 py-3 bg-slate-800/30 dark:bg-slate-800/30 light:bg-white/30 high-contrast:bg-gray-50 rounded-lg border border-slate-700/50 dark:border-slate-700/50 light:border-slate-300/50 high-contrast:border-gray-400">
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600">
                Data: <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800">CoinGecko</span>
                {crypto.isLive && (
                  <span className="ml-2">• Live: <span className="font-semibold text-green-400">Binance</span></span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-600">
                Updated: <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800">{lastUpdate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenCrypto;
