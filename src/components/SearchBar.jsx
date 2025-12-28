import { useState, useRef, useEffect } from 'react';
import { searchCrypto } from '../services/api';

const SearchBar = ({ onSelectCrypto, onToggleFavorite, isFavorite }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearch = async (value) => {
    setQuery(value);
    
    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults = await searchCrypto(value);
        setResults(searchResults.slice(0, 8));
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelectCrypto = (coin) => {
    onSelectCrypto(coin);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleFavoriteClick = (e, coin) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(coin);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setShowResults(true)}
          placeholder="Zoek naar cryptocurrencies..."
          className="w-full bg-slate-800 dark:bg-slate-800 light:bg-white black-white:bg-white black-white:hover:bg-[#f8f8f8] white-black:bg-black border border-slate-600 dark:border-slate-600 light:border-slate-300 black-white:border-black white-black:border-white rounded-lg px-4 py-3 pl-12 pr-10 text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 black-white:placeholder-gray-600 white-black:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-purple dark:focus:ring-neon-purple light:focus:ring-neon-purple black-white:focus:ring-black white-black:focus:ring-white"
        />
        <svg
          className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        
        {/* Clear button or loading spinner */}
        {isSearching ? (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : query.length > 0 && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black border border-slate-700 dark:border-slate-700 light:border-slate-300 black-white:border-black white-black:border-white rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {results.map((coin) => (
            <div
              key={coin.id}
              onClick={() => handleSelectCrypto(coin)}
              className="flex items-center gap-3 p-3 sm:p-4 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 black-white:hover:bg-gray-200 white-black:hover:bg-slate-700 transition-colors border-b border-slate-700 dark:border-slate-700 light:border-slate-200 black-white:border-gray-300 white-black:border-slate-600 last:border-b-0 cursor-pointer active:bg-slate-600"
            >
              <img src={coin.thumb || coin.large} alt={coin.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white truncate">{coin.name}</p>
                <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 black-white:text-gray-600 white-black:text-gray-400 uppercase">{coin.symbol}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={(e) => handleFavoriteClick(e, coin)}
                  className={`p-2.5 sm:p-2 rounded-full transition-all min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center active:scale-95 ${
                    isFavorite(coin)
                      ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30'
                      : 'text-slate-400 bg-slate-700/50 hover:text-yellow-400 hover:bg-yellow-400/10 black-white:bg-gray-200 black-white:text-gray-600 white-black:bg-slate-600'
                  }`}
                  aria-label={isFavorite(coin) ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
                <span className="text-xs text-slate-500 hidden sm:inline">#{coin.market_cap_rank || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
