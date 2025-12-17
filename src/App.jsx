import { useState, useEffect } from 'react';
import { getTopCryptos, getFiatRates, getCryptoDetails } from './services/api';
import CurrencyConverter from './components/CurrencyConverter';
import CryptoCard from './components/CryptoCard';
import FiatCard from './components/FiatCard';
import CryptoDetailModal from './components/CryptoDetailModal';
import SearchBar from './components/SearchBar';
import SkeletonLoader from './components/SkeletonLoader';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [favoriteCryptos, setFavoriteCryptos] = useState([]);
  const [customWatchlist, setCustomWatchlist] = useState([]);
  const [fiatRates, setFiatRates] = useState({});
  const [eurRates, setEurRates] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    // Load favorites and custom watchlist from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteCryptos') || '[]');
    const savedWatchlist = JSON.parse(localStorage.getItem('customWatchlist') || '[]');
    setFavoriteCryptos(savedFavorites);
    setCustomWatchlist(savedWatchlist);
    
    // Refresh data every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [cryptos, usdRates, eurRatesData] = await Promise.all([
        getTopCryptos(10),
        getFiatRates('USD'),
        getFiatRates('EUR')
      ]);
      setCryptoData(cryptos);
      setFiatRates(usdRates);
      setEurRates(eurRatesData);
      
      // Update favorite cryptos with fresh data
      if (favoriteCryptos.length > 0) {
        const updatedFavorites = favoriteCryptos.map(fav => {
          const updatedData = cryptos.find(crypto => crypto.id === fav.id);
          return updatedData || fav;
        });
        setFavoriteCryptos(updatedFavorites);
        localStorage.setItem('favoriteCryptos', JSON.stringify(updatedFavorites));
      }
      
      // Update custom watchlist with fresh data
      if (customWatchlist.length > 0) {
        updateWatchlistData();
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. API limit may be reached. Retrying in 60 seconds...');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoClick = (crypto) => {
    setSelectedCrypto(crypto);
  };

  const toggleFavorite = (crypto) => {
    const isFavorite = favoriteCryptos.some(fav => fav.id === crypto.id);
    let updatedFavorites;
    
    if (isFavorite) {
      // Remove from favorites
      updatedFavorites = favoriteCryptos.filter(fav => fav.id !== crypto.id);
    } else {
      // Add to favorites
      updatedFavorites = [...favoriteCryptos, crypto];
    }
    
    setFavoriteCryptos(updatedFavorites);
    localStorage.setItem('favoriteCryptos', JSON.stringify(updatedFavorites));
  };

  const isFavorite = (crypto) => {
    return favoriteCryptos.some(fav => fav.id === crypto.id);
  };

  const handleSearchSelect = async (coin) => {
    try {
      const details = await getCryptoDetails(coin.id);
      // Transform to match the expected format
      const transformedData = {
        id: details.id,
        symbol: details.symbol,
        name: details.name,
        image: details.image?.large || details.image?.small,
        current_price: details.market_data?.current_price?.usd,
        market_cap: details.market_data?.market_cap?.usd,
        market_cap_rank: details.market_cap_rank,
        total_volume: details.market_data?.total_volume?.usd,
        high_24h: details.market_data?.high_24h?.usd,
        low_24h: details.market_data?.low_24h?.usd,
        price_change_percentage_24h: details.market_data?.price_change_percentage_24h,
        price_change_percentage_7d_in_currency: details.market_data?.price_change_percentage_7d,
        circulating_supply: details.market_data?.circulating_supply,
        ath: details.market_data?.ath?.usd,
        sparkline_in_7d: details.market_data?.sparkline_7d,
      };
      
      // Add to custom watchlist
      addToWatchlist(transformedData);
      setSelectedCrypto(transformedData);
    } catch (err) {
      console.error('Error fetching crypto details:', err);
    }
  };

  const addToWatchlist = (crypto) => {
    const isAlreadyInWatchlist = customWatchlist.some(item => item.id === crypto.id);
    if (!isAlreadyInWatchlist) {
      const updatedWatchlist = [...customWatchlist, crypto];
      setCustomWatchlist(updatedWatchlist);
      localStorage.setItem('customWatchlist', JSON.stringify(updatedWatchlist));
    }
  };

  const removeFromWatchlist = (cryptoId) => {
    const updatedWatchlist = customWatchlist.filter(item => item.id !== cryptoId);
    setCustomWatchlist(updatedWatchlist);
    localStorage.setItem('customWatchlist', JSON.stringify(updatedWatchlist));
  };

  const updateWatchlistData = async () => {
    try {
      const updatedWatchlist = await Promise.all(
        customWatchlist.map(async (crypto) => {
          try {
            const details = await getCryptoDetails(crypto.id);
            return {
              id: details.id,
              symbol: details.symbol,
              name: details.name,
              image: details.image?.large || details.image?.small || crypto.image,
              current_price: details.market_data?.current_price?.usd,
              market_cap: details.market_data?.market_cap?.usd,
              market_cap_rank: details.market_cap_rank,
              total_volume: details.market_data?.total_volume?.usd,
              high_24h: details.market_data?.high_24h?.usd,
              low_24h: details.market_data?.low_24h?.usd,
              price_change_percentage_24h: details.market_data?.price_change_percentage_24h,
              price_change_percentage_7d_in_currency: details.market_data?.price_change_percentage_7d,
              circulating_supply: details.market_data?.circulating_supply,
              ath: details.market_data?.ath?.usd,
              sparkline_in_7d: details.market_data?.sparkline_7d,
            };
          } catch (err) {
            console.error(`Error updating ${crypto.name}:`, err);
            return crypto; // Return old data if update fails
          }
        })
      );
      setCustomWatchlist(updatedWatchlist);
      localStorage.setItem('customWatchlist', JSON.stringify(updatedWatchlist));
    } catch (err) {
      console.error('Error updating watchlist:', err);
    }
  };

  const fiatPairs = [
    { from: 'EUR', to: 'USD', rate: fiatRates['EUR'] },
    { from: 'GBP', to: 'USD', rate: fiatRates['GBP'] },
    { from: 'JPY', to: 'USD', rate: fiatRates['JPY'] },
    { from: 'EUR', to: 'THB', rate: eurRates['THB'] },
    { from: 'EUR', to: 'VND', rate: eurRates['VND'] }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-dark-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                Crypto & Currency Tracker
              </h1>
              <p className="text-slate-400 text-sm mt-1">Real-time exchange rates and market data</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-400">Live</span>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl">
            <SearchBar onSelectCrypto={handleSearchSelect} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Currency Converter */}
        <div className="mb-8">
          {loading ? (
            <SkeletonLoader type="converter" />
          ) : (
            <CurrencyConverter cryptoData={cryptoData} fiatRates={fiatRates} />
          )}
        </div>

        {/* Custom Watchlist */}
        {customWatchlist.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">My Custom Watchlist</span>
              </h2>
              <span className="text-sm text-slate-400">({customWatchlist.length} tracked)</span>
            </div>
            
            <div className="bg-dark-card/30 border border-neon-cyan/30 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {customWatchlist.map((crypto) => (
                  <div key={crypto.id} className="relative">
                    <CryptoCard
                      crypto={crypto}
                      onClick={handleCryptoClick}
                    />
                    <button
                      onClick={() => removeFromWatchlist(crypto.id)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                      aria-label="Remove from watchlist"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-400 text-center">
                  💡 Use the search bar above to find and add any cryptocurrency to your watchlist
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Crypto Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-neon-cyan">Top 10 Cryptocurrencies</span>
            <span className="text-sm font-normal text-slate-400">(Click for details)</span>
          </h2>
          
          {loading ? (
            <SkeletonLoader count={10} type="card" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {cryptoData.map((crypto) => (
                <div key={crypto.id} className="relative">
                  <CryptoCard
                    crypto={crypto}
                    onClick={handleCryptoClick}
                  />
                  <button
                    onClick={() => toggleFavorite(crypto)}
                    className={`absolute top-2 right-2 p-1 rounded-full ${isFavorite(crypto) ? 'text-yellow-400 bg-yellow-400/20' : 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                    aria-label={isFavorite(crypto) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Favorite Cryptocurrencies */}
        {favoriteCryptos.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="text-yellow-400">My Favorite Cryptocurrencies</span>
              </h2>
              <span className="text-sm text-slate-400">({favoriteCryptos.length})</span>
            </div>
            
            {loading ? (
              <SkeletonLoader count={favoriteCryptos.length > 3 ? 3 : favoriteCryptos.length} type="card" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {favoriteCryptos.map((crypto) => (
                  <div key={crypto.id} className="relative">
                    <CryptoCard
                      crypto={crypto}
                      onClick={handleCryptoClick}
                    />
                    <button
                      onClick={() => toggleFavorite(crypto)}
                      className="absolute top-2 right-2 p-1 rounded-full text-yellow-400 bg-yellow-400/20"
                      aria-label="Remove from favorites"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Fiat Exchange Rates */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            <span className="text-neon-purple">Fiat Exchange Rates</span>
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <SkeletonLoader count={5} type="card" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {fiatPairs.map((pair) => (
                <FiatCard
                  key={`${pair.from}-${pair.to}`}
                  from={pair.from}
                  to={pair.to}
                  rate={pair.rate}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>Data provided by CoinGecko API and ExchangeRate-API</p>
          <p className="mt-2">Updates every 60 seconds</p>
        </div>
      </footer>

      {/* Detail Modal */}
      {selectedCrypto && (
        <CryptoDetailModal
          crypto={selectedCrypto}
          onClose={() => setSelectedCrypto(null)}
        />
      )}
    </div>
  );
}

export default App;
