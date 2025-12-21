import { useState } from 'react';
import { searchCrypto } from '../services/api';

const SearchBar = ({ onSelectCrypto, onToggleFavorite, isFavorite }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);
    
    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

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
  };

  const handleSelectCrypto = (coin) => {
    onSelectCrypto(coin);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          placeholder="Zoek naar cryptocurrencies..."
          className="w-full bg-slate-800 dark:bg-slate-800 light:bg-white high-contrast:bg-white border border-slate-600 dark:border-slate-600 light:border-slate-300 high-contrast:border-black rounded-lg px-4 py-3 pl-12 text-white dark:text-white light:text-slate-800 high-contrast:text-black placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 high-contrast:placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-neon-purple dark:focus:ring-neon-purple light:focus:ring-neon-purple high-contrast:focus:ring-high-contrast-accent"
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
        {isSearching && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {results.map((coin) => (
            <div
              key={coin.id}
              className="flex items-center gap-3 p-4 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-100 high-contrast:hover:bg-gray-300 transition-colors border-b border-slate-700 dark:border-slate-700 light:border-slate-200 high-contrast:border-gray-400 last:border-b-0"
            >
              <img src={coin.thumb || coin.large} alt={coin.name} className="w-8 h-8 rounded-full" />
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => handleSelectCrypto(coin)}
              >
                <p className="font-semibold text-white dark:text-white light:text-slate-800 high-contrast:text-black">{coin.name}</p>
                <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-800 uppercase">{coin.symbol}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(coin);
                  }}
                  className={`p-1.5 rounded-full transition-all ${
                    isFavorite(coin)
                      ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30'
                      : 'text-slate-500 bg-slate-700/50 hover:text-yellow-400 hover:bg-yellow-400/10'
                  }`}
                  aria-label={isFavorite(coin) ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
                <span className="text-xs text-slate-500">#{coin.market_cap_rank || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
