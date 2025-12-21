import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const FullscreenCrypto = ({ crypto, onClose }) => {
  const { theme } = useTheme();

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!crypto) return null;

  const priceChange = crypto.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 light:from-slate-100 light:via-slate-50 light:to-slate-100 high-contrast:from-white high-contrast:via-gray-50 high-contrast:to-white">
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
      </div>
    </div>
  );
};

export default FullscreenCrypto;
