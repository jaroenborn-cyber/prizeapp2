import { useTheme } from '../context/ThemeContext';

const CryptoCard = ({ crypto, onClick, onFavoriteToggle, isFavorite, showFavoriteButton = false, onRemove = null }) => {
  const { theme } = useTheme();
  const priceChange24h = crypto.price_change_percentage_24h || 0;
  const isPositive = priceChange24h >= 0;

  const formatPrice = (price) => {
    if (!price && price !== 0) return 'N/A';
    if (price >= 1) {
      return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  };

  const formatMarketCap = (marketCap) => {
    if (!marketCap && marketCap !== 0) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toFixed(2)}`;
  };

  return (
    <div
      onClick={() => onClick(crypto)}
      className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black rounded-xl p-3 sm:p-5 shadow-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 black-white:border-black white-black:border-white hover:border-neon-cyan dark:hover:border-neon-cyan light:hover:border-neon-purple black-white:hover:border-gray-600 white-black:hover:border-gray-400 transition-all cursor-pointer sm:hover:scale-105 duration-200 outline-none focus:outline-none"
    >
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src={crypto.image} alt={crypto.name} className="w-7 h-7 sm:w-10 sm:h-10 rounded-full" />
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white truncate max-w-[80px] sm:max-w-none">{crypto.name}</h3>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 black-white:text-gray-800 white-black:text-gray-300 uppercase">{crypto.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Live indicator */}
          {crypto.isLive && (
            <>
              <span 
                className="sm:hidden live-dot w-2 h-2 bg-green-400 rounded-full animate-pulse"
                style={theme === 'black-white' ? { backgroundColor: '#000000' } : {}}
                title="Live price"
              ></span>
              <span 
                className="hidden sm:flex text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded items-center gap-1 live-badge"
                style={theme === 'black-white' ? { backgroundColor: '#e0e0e0', color: '#000000' } : {}}
              >
                <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse" style={theme === 'black-white' ? { backgroundColor: '#000000' } : {}}></span>
                LIVE
              </span>
            </>
          )}
          {/* Favorite button */}
          {showFavoriteButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle(crypto);
              }}
              className={`p-1 sm:p-1.5 rounded-full transition-all ${
                isFavorite
                  ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30'
                  : 'text-slate-500 bg-slate-700/50 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          )}
          {/* Rank badge */}
          <span 
            className="text-xs bg-slate-700 dark:bg-slate-700 light:bg-slate-200 black-white:bg-gray-300 white-black:bg-gray-700 text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white px-1.5 py-0.5 rounded whitespace-nowrap"
            style={theme === 'black-white' ? { backgroundColor: '#000000', color: '#ffffff' } : {}}
          >#{crypto.market_cap_rank}</span>
        </div>
      </div>

      <div className="mb-2 sm:mb-3">
        <p className="text-lg sm:text-2xl font-bold text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white">${formatPrice(crypto.current_price)}</p>
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 black-white:text-gray-800 white-black:text-gray-300">USD</p>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 black-white:text-gray-700 white-black:text-gray-400 mb-0.5 sm:mb-1">24h</p>
          <p className={`font-semibold ${isPositive ? 'text-green-400 white-black:text-white' : 'text-red-400 white-black:text-white'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 black-white:text-gray-700 white-black:text-gray-400 mb-0.5 sm:mb-1">MCap</p>
          <p className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-600 black-white:text-gray-800 white-black:text-gray-300">{formatMarketCap(crypto.market_cap)}</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;
