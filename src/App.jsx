import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { getTopCryptos, getFiatRates, getCryptoDetails } from './services/api';
import binanceService from './services/binance';
import CurrencyConverter from './components/CurrencyConverter';
import CryptoCard from './components/CryptoCard';
import FiatCard from './components/FiatCard';
import CryptoDetailModal from './components/CryptoDetailModal';
import FullscreenCrypto from './components/FullscreenCrypto';
import SearchBar from './components/SearchBar';
import SkeletonLoader from './components/SkeletonLoader';
import ThemeSwitcher from './components/ThemeSwitcher';
import LanguageSwitcher from './components/LanguageSwitcher';
import BlockExplorer from './components/BlockExplorer';
import { useLanguage } from './context/LanguageContext';
import { translations } from './utils/translations';

function App() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [activeTab, setActiveTab] = useState('crypto');
  const [cryptoData, setCryptoData] = useState([]);
  const [favoriteCryptos, setFavoriteCryptos] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [fiatRates, setFiatRates] = useState({});
  const [eurRates, setEurRates] = useState({});
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [fullscreenCrypto, setFullscreenCrypto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const priceCallbacksRef = useRef({});

  useEffect(() => {
    fetchData();
    // Load favorites and recently viewed from localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteCryptos') || '[]');
    const savedRecentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setFavoriteCryptos(savedFavorites);
    setRecentlyViewed(savedRecentlyViewed);
    
    // Clean up old customWatchlist data
    localStorage.removeItem('customWatchlist');
    
    // Refresh data every 5 minutes (300 seconds) to avoid API rate limits
    // The API will use cached data if it's less than 5 minutes old
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const [cryptos, usdRates, eurRatesData] = await Promise.all([
        getTopCryptos(100),
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
      
      // Update recently viewed with fresh data
      if (recentlyViewed.length > 0) {
        updateRecentlyViewedData();
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Only show error if we don't have any data yet (first load)
      if (cryptoData.length === 0) {
        setError('Kon geen data ophalen. Controleer je internetverbinding.');
      }
      // If we have cached data, silently continue using it
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to Binance live prices for all visible crypto
  useEffect(() => {
    if (cryptoData.length === 0) return;

    // Get all unique coins that need live prices
    const allCoins = [...cryptoData, ...favoriteCryptos, ...recentlyViewed];
    const uniqueCoins = Array.from(new Map(allCoins.map(coin => [coin.id, coin])).values());

    // Subscribe to Binance-listed coins
    uniqueCoins.forEach(coin => {
      if (binanceService.isBinanceListed(coin.id)) {
        const callback = (priceData) => {
          setLivePrices(prev => ({
            ...prev,
            [coin.id]: {
              price: priceData.price,
              priceChange24h: priceData.priceChange24h,
              timestamp: priceData.timestamp
            }
          }));
        };

        priceCallbacksRef.current[coin.id] = callback;
        binanceService.subscribe(coin.id, callback);
      }
    });

    // Cleanup function
    return () => {
      Object.keys(priceCallbacksRef.current).forEach(coinId => {
        binanceService.unsubscribe(coinId, priceCallbacksRef.current[coinId]);
      });
      priceCallbacksRef.current = {};
    };
    }, [cryptoData, favoriteCryptos, recentlyViewed]);

  const handleCryptoClick = (crypto) => {
    setSelectedCrypto(crypto);
    
    // Add to recently viewed (max 20 items)
    const isAlreadyViewed = recentlyViewed.some(item => item.id === crypto.id);
    let updatedRecentlyViewed;
    
    if (isAlreadyViewed) {
      // Move to front if already exists
      updatedRecentlyViewed = [
        crypto,
        ...recentlyViewed.filter(item => item.id !== crypto.id)
      ];
    } else {
      // Add to front, limit to 20 items
      updatedRecentlyViewed = [crypto, ...recentlyViewed].slice(0, 20);
    }
    
    setRecentlyViewed(updatedRecentlyViewed);
    localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
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

  const toggleFavoriteFromSearch = async (coin) => {
    const existingFavorite = favoriteCryptos.find(fav => fav.id === coin.id);
    
    if (existingFavorite) {
      // Remove from favorites
      const updatedFavorites = favoriteCryptos.filter(fav => fav.id !== coin.id);
      setFavoriteCryptos(updatedFavorites);
      localStorage.setItem('favoriteCryptos', JSON.stringify(updatedFavorites));
    } else {
      // Fetch full details and add to favorites
      try {
        const details = await getCryptoDetails(coin.id);
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
        
        const updatedFavorites = [...favoriteCryptos, transformedData];
        setFavoriteCryptos(updatedFavorites);
        localStorage.setItem('favoriteCryptos', JSON.stringify(updatedFavorites));
      } catch (err) {
        console.error('Error adding to favorites:', err);
      }
    }
  };

  const isFavorite = (crypto) => {
    return favoriteCryptos.some(fav => fav.id === crypto.id);
  };

  const handleFavoriteDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(favoriteCryptos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFavoriteCryptos(items);
    localStorage.setItem('favoriteCryptos', JSON.stringify(items));
  };

  // Merge live prices with crypto data
  const mergeLivePrices = (crypto) => {  if (livePrices[crypto.id]) {
      return {
        ...crypto,
        current_price: livePrices[crypto.id].price,
        // Only use Binance 24h change if it's valid (not 0 and reasonable)
        price_change_percentage_24h: livePrices[crypto.id].priceChange24h !== 0 && Math.abs(livePrices[crypto.id].priceChange24h) > 0.01
          ? livePrices[crypto.id].priceChange24h
          : crypto.price_change_percentage_24h,
        isLive: true
      };
    }
    return { ...crypto, isLive: false };
  };

  // Update selected crypto with live prices
  useEffect(() => {
    if (selectedCrypto && livePrices[selectedCrypto.id]) {
      setSelectedCrypto(prevCrypto => ({
        ...prevCrypto,
        current_price: livePrices[selectedCrypto.id].price,
        price_change_percentage_24h: livePrices[selectedCrypto.id].priceChange24h !== 0 && Math.abs(livePrices[selectedCrypto.id].priceChange24h) > 0.01
          ? livePrices[selectedCrypto.id].priceChange24h
          : prevCrypto.price_change_percentage_24h,
        isLive: true
      }));
    }
  }, [livePrices, selectedCrypto?.id]);

  // Update fullscreen crypto with live prices
  useEffect(() => {
    if (fullscreenCrypto && livePrices[fullscreenCrypto.id]) {
      setFullscreenCrypto(prevCrypto => ({
        ...prevCrypto,
        current_price: livePrices[fullscreenCrypto.id].price,
        price_change_percentage_24h: livePrices[fullscreenCrypto.id].priceChange24h !== 0 && Math.abs(livePrices[fullscreenCrypto.id].priceChange24h) > 0.01
          ? livePrices[fullscreenCrypto.id].priceChange24h
          : prevCrypto.price_change_percentage_24h,
        isLive: true
      }));
    }
  }, [livePrices, fullscreenCrypto?.id]);

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
      
      // Open the detail modal
      setSelectedCrypto(transformedData);
      
      // Add to recently viewed
      handleCryptoClick(transformedData);
    } catch (err) {
      console.error('Error fetching crypto details:', err);
    }
  };

  const removeFromRecentlyViewed = (cryptoId) => {
    const updatedRecentlyViewed = recentlyViewed.filter(item => item.id !== cryptoId);
    setRecentlyViewed(updatedRecentlyViewed);
    localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
  };

  const updateRecentlyViewedData = async () => {
    try {
      const updatedRecentlyViewed = await Promise.all(
        recentlyViewed.map(async (crypto) => {
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
      setRecentlyViewed(updatedRecentlyViewed);
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
    } catch (err) {
      console.error('Error updating recently viewed:', err);
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
    <div className="min-h-screen bg-dark-bg dark:bg-dark-bg light:bg-light-bg high-contrast:bg-high-contrast-bg text-white dark:text-white light:text-slate-800 high-contrast:text-high-contrast-text">
      {/* Header */}
      <header className="border-b border-slate-800 dark:border-slate-800 light:border-slate-300 high-contrast:border-white bg-dark-card/50 dark:bg-dark-card/50 light:bg-light-card high-contrast:bg-high-contrast-card backdrop-blur-sm sticky top-0 z-40">
        <div className="w-full px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
                {t.appTitle}
              </h1>
              <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 text-sm mt-1">{t.appSubtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-2 mt-6 border-b border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
            <button
              onClick={() => setActiveTab('crypto')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'crypto'
                  ? 'text-neon-cyan border-b-2 border-neon-cyan'
                  : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-800 high-contrast:text-gray-600 high-contrast:hover:text-black'
              }`}
            >
              💰 {t.cryptoTracker}
            </button>
            <button
              onClick={() => setActiveTab('explorer')}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === 'explorer'
                  ? 'text-orange-500 border-b-2 border-orange-500'
                  : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 light:text-slate-600 light:hover:text-slate-800 high-contrast:text-gray-600 high-contrast:hover:text-black'
              }`}
            >
              ₿ {t.blockExplorer}
            </button>
          </div>
          
          {/* Search Bar */}
          {activeTab === 'crypto' && (
            <div className="max-w-2xl mt-6">
              <SearchBar 
                onSelectCrypto={handleSearchSelect} 
                onToggleFavorite={toggleFavoriteFromSearch}
                isFavorite={isFavorite}
              />
            </div>
          )}
        </div>
      </header>

      {activeTab === 'explorer' ? (
        <BlockExplorer />
      ) : (
      <main className="w-full px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-500/10 dark:bg-red-500/10 light:bg-red-100 high-contrast:bg-red-900 border border-red-500/50 dark:border-red-500/50 light:border-red-300 high-contrast:border-red-300 rounded-lg p-4 text-red-400 dark:text-red-400 light:text-red-700 high-contrast:text-red-200">
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        )}

        {/* Favorite Cryptocurrencies */}
        {favoriteCryptos.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="text-yellow-400">{t.myFavorites}</span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-700">👆 {t.dragToReorder}</span>
                <span className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">({favoriteCryptos.length})</span>
              </div>
            </div>
            
            {loading ? (
              <SkeletonLoader count={favoriteCryptos.length > 3 ? 3 : favoriteCryptos.length} type="card" />
            ) : (
              <DragDropContext onDragEnd={handleFavoriteDragEnd}>
                <Droppable droppableId="favorites" direction="horizontal">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
                    >
                      {favoriteCryptos.map((crypto, index) => {
                        const cryptoWithLivePrice = mergeLivePrices(crypto);
                        return (
                        <Draggable key={crypto.id} draggableId={crypto.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={provided.draggableProps.style}
                            >
                              <CryptoCard
                                crypto={cryptoWithLivePrice}
                                onClick={handleCryptoClick}
                                onFavoriteToggle={toggleFavorite}
                                isFavorite={true}
                                showFavoriteButton={true}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </section>
        )}

        {/* Crypto Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span className="text-neon-cyan">{t.topCryptos}</span>
            <span className="text-sm font-normal text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">({t.clickForDetails})</span>
          </h2>
          
          {loading ? (
            <SkeletonLoader count={10} type="card" />
          ) : (
            <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50 dark:bg-slate-800/50 light:bg-slate-100 high-contrast:bg-gray-200 border-b border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.rank}</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.name}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.price}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.change24h}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.change7d}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.marketCap}</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.volume24h}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-700 uppercase tracking-wider">{t.favorite}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 dark:divide-slate-700 light:divide-slate-300 high-contrast:divide-black">
                    {cryptoData.map((crypto) => {
                      const cryptoWithLivePrice = mergeLivePrices(crypto);
                      const priceChange24h = cryptoWithLivePrice.price_change_percentage_24h || 0;
                      const priceChange7d = cryptoWithLivePrice.price_change_percentage_7d_in_currency || 0;
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

                      return (
                        <tr 
                          key={crypto.id} 
                          onClick={() => handleCryptoClick(cryptoWithLivePrice)}
                          className="hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-50 high-contrast:hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                          <td className="px-3 py-2.5 whitespace-nowrap text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-800">
                            {crypto.market_cap_rank}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <img src={crypto.image} alt={crypto.name} className="w-7 h-7 rounded-full" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-medium text-white dark:text-white light:text-slate-800 high-contrast:text-black">{crypto.name}</span>
                                  {cryptoWithLivePrice.isLive && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      <span className="inline-block w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
                                      {t.live}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-800 uppercase">{crypto.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-medium text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                            ${formatPrice(cryptoWithLivePrice.current_price)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-semibold">
                            <span className={isPositive24h ? 'text-green-400' : 'text-red-400'}>
                              {isPositive24h ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm font-semibold">
                            <span className={isPositive7d ? 'text-green-400' : 'text-red-400'}>
                              {isPositive7d ? '▲' : '▼'} {Math.abs(priceChange7d).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 high-contrast:text-gray-800">
                            {formatMarketCap(crypto.market_cap)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-right text-sm text-slate-300 dark:text-slate-300 light:text-slate-600 high-contrast:text-gray-800">
                            {formatMarketCap(crypto.total_volume)}
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleFavorite(crypto)}
                              className={`p-1 rounded-full ${isFavorite(crypto) ? 'text-yellow-400 bg-yellow-400/20' : 'text-slate-500 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                              aria-label={isFavorite(crypto) ? "Verwijder van favorieten" : "Voeg toe aan favorieten"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Fiat Exchange Rates */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            <span className="text-neon-purple">{t.fiatRates}</span>
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

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">{t.recentlyViewed}</span>
              </h2>
              <span className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">({recentlyViewed.length} {t.viewed})</span>
            </div>
            
            <div className="bg-dark-card/30 dark:bg-dark-card/30 light:bg-slate-50 high-contrast:bg-gray-100 border border-neon-cyan/30 dark:border-neon-cyan/30 light:border-slate-300 high-contrast:border-black rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recentlyViewed.map((crypto) => {
                  const cryptoWithLivePrice = mergeLivePrices(crypto);
                  return (
                  <div key={crypto.id} className="relative">
                    <CryptoCard
                      crypto={cryptoWithLivePrice}
                      onClick={handleCryptoClick}
                      onFavoriteToggle={toggleFavorite}
                      isFavorite={isFavorite(crypto)}
                      showFavoriteButton={true}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromRecentlyViewed(crypto.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                      aria-label="Remove from recently viewed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-gray-400">
                <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 text-center">
                  🔍 {t.recentlyViewedDesc}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Currency Converter */}
        <div className="mb-8">
          {loading ? (
            <SkeletonLoader type="converter" />
          ) : (
            <CurrencyConverter cryptoData={cryptoData} fiatRates={fiatRates} />
          )}
        </div>
      </main>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 dark:border-slate-800 light:border-slate-300 high-contrast:border-white mt-16 py-8">
        <div className="w-full px-4 text-center text-slate-500 dark:text-slate-500 light:text-slate-600 high-contrast:text-gray-400 text-sm">
          <p>{t.dataProvidedBy}</p>
          <p className="mt-2">{t.updatesEvery}</p>
        </div>
      </footer>

      {/* Detail Modal */}
      {selectedCrypto && (
        <CryptoDetailModal
          crypto={selectedCrypto}
          onClose={() => setSelectedCrypto(null)}
          onToggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
          onFullscreen={() => {
            setFullscreenCrypto(selectedCrypto);
            setSelectedCrypto(null);
          }}
        />
      )}

      {/* Fullscreen Mode */}
      {fullscreenCrypto && (
        <FullscreenCrypto
          crypto={fullscreenCrypto}
          onClose={() => setFullscreenCrypto(null)}
        />
      )}
    </div>
  );
}

export default App;
