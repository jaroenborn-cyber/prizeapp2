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
  const [fiatRates, setFiatRates] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    // Refresh data every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [cryptos, rates] = await Promise.all([
        getTopCryptos(10),
        getFiatRates('USD')
      ]);
      setCryptoData(cryptos);
      setFiatRates(rates);
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
      setSelectedCrypto(transformedData);
    } catch (err) {
      console.error('Error fetching crypto details:', err);
    }
  };

  const fiatPairs = [
    { from: 'EUR', to: 'USD' },
    { from: 'GBP', to: 'USD' },
    { from: 'JPY', to: 'USD' }
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
                <CryptoCard
                  key={crypto.id}
                  crypto={crypto}
                  onClick={handleCryptoClick}
                />
              ))}
            </div>
          )}
        </section>

        {/* Fiat Exchange Rates */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            <span className="text-neon-purple">Fiat Exchange Rates</span>
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonLoader count={3} type="card" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {fiatPairs.map((pair) => (
                <FiatCard
                  key={`${pair.from}-${pair.to}`}
                  from={pair.from}
                  to={pair.to}
                  rate={fiatRates[pair.from]}
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
