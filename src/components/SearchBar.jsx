import { useState } from 'react';
import { searchCrypto } from '../services/api';

const SearchBar = ({ onSelectCrypto }) => {
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
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 pl-12 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-purple"
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
        <div className="absolute z-10 w-full mt-2 bg-dark-card border border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {results.map((coin) => (
            <div
              key={coin.id}
              onClick={() => handleSelectCrypto(coin)}
              className="flex items-center gap-3 p-4 hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-700 last:border-b-0"
            >
              <img src={coin.thumb || coin.large} alt={coin.name} className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <p className="font-semibold text-white">{coin.name}</p>
                <p className="text-sm text-slate-400 uppercase">{coin.symbol}</p>
              </div>
              <span className="text-xs text-slate-500">#{coin.market_cap_rank || 'N/A'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
