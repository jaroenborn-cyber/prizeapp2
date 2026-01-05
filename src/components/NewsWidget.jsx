import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const CACHE_KEY = 'crypto_news_cache';
const ARCHIVE_KEY = 'crypto_news_archive';
const CACHE_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

function NewsWidget() {
  const { language } = useLanguage();
  const [news, setNews] = useState([]);
  const [archive, setArchive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    fetchCryptoNews();
    loadArchive();
  }, []);

  const fetchCryptoNews = async () => {
    try {
      // Check cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        // Use cache if less than 8 hours old
        if (age < CACHE_DURATION) {
          setNews(data || []);
          setLoading(false);
          return;
        }
      }

      // Fetch fresh data from CoinGecko trending
      const response = await fetch(
        'https://api.coingecko.com/api/v3/search/trending'
      );
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result || !result.coins || !Array.isArray(result.coins)) {
        console.error('Invalid API response:', result);
        setNews([]);
        setLoading(false);
        return;
      }
      
      // Transform trending coins into news items
      const newsData = result.coins.slice(0, 6).map((item) => ({
        id: item.item.id,
        title: `${item.item.name} (${item.item.symbol}) ${language === 'nl' ? 'Trending' : 'Trending'} #${item.item.score + 1}`,
        url: `https://www.coingecko.com/en/coins/${item.item.id}`,
        source: { title: 'CoinGecko Trending' },
        published_at: new Date().toISOString(),
        currencies: [{ code: item.item.symbol.toUpperCase() }],
        description: `Market Cap Rank: #${item.item.market_cap_rank || 'N/A'}`
      }));
      
      // Update archive
      updateArchive(newsData);
      
      // Cache the data
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: newsData,
        timestamp: Date.now()
      }));
      
      setNews(newsData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      setNews([]);
      setLoading(false);
    }
  };

  const loadArchive = () => {
    try {
      const stored = localStorage.getItem(ARCHIVE_KEY);
      if (stored) {
        const archiveData = JSON.parse(stored);
        setArchive(archiveData);
      }
    } catch (error) {
      console.error('Failed to load archive:', error);
    }
  };

  const updateArchive = (newItems) => {
    try {
      const existing = localStorage.getItem(ARCHIVE_KEY);
      let archiveData = existing ? JSON.parse(existing) : [];
      
      // Add new items that aren't already in archive
      newItems.forEach(item => {
        if (!archiveData.find(a => a.id === item.id)) {
          archiveData.unshift(item);
        }
      });
      
      // Keep last 100 items
      archiveData = archiveData.slice(0, 100);
      
      localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archiveData));
      setArchive(archiveData);
    } catch (error) {
      console.error('Failed to update archive:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return language === 'nl' ? 'zojuist' : 'just now';
    if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      return language === 'nl' ? `${mins}m geleden` : `${mins}m ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return language === 'nl' ? `${hours}u geleden` : `${hours}h ago`;
    }
    const days = Math.floor(seconds / 86400);
    return language === 'nl' ? `${days}d geleden` : `${days}d ago`;
  };

  if (loading) {
    return (
      <section className="mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            {language === 'nl' ? '🔥 Trending Crypto' : '🔥 Trending Crypto'}
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-slate-200 black-white:bg-gray-300 white-black:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-700 dark:bg-slate-700 light:bg-slate-200 black-white:bg-gray-300 white-black:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-700 dark:bg-slate-700 light:bg-slate-200 black-white:bg-gray-300 white-black:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 sm:mb-12">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">
          <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
            {language === 'nl' ? '🔥 Trending Crypto' : '🔥 Trending Crypto'}
          </span>
        </h2>
        <button
          onClick={() => setShowArchive(!showArchive)}
          className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300 black-white:hover:bg-gray-300 white-black:hover:bg-gray-700 transition-colors"
        >
          {showArchive 
            ? (language === 'nl' ? '← Terug' : '← Back')
            : (language === 'nl' ? `Archief (${archive.length})` : `Archive (${archive.length})`)
          }
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(showArchive ? archive : news).length === 0 ? (
          <div className="col-span-full text-center text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-700 white-black:text-gray-400 py-8">
            {language === 'nl' ? 'Geen nieuws beschikbaar' : 'No news available'}
          </div>
        ) : (
          (showArchive ? archive : news).map((item, index) => (
          <div
            key={index}
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
            className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black border border-slate-800 dark:border-slate-800 light:border-slate-300 black-white:border-black white-black:border-white rounded-xl p-4 hover:border-neon-cyan dark:hover:border-neon-cyan light:hover:border-neon-cyan black-white:hover:border-black white-black:hover:border-white transition-all cursor-pointer group"
          >
            <div className="flex flex-col h-full">
              <h3 className="font-semibold text-sm mb-2 text-slate-100 dark:text-slate-100 light:text-slate-900 black-white:text-black white-black:text-white group-hover:text-neon-cyan dark:group-hover:text-neon-cyan light:group-hover:text-neon-cyan black-white:group-hover:text-black white-black:group-hover:text-white line-clamp-2">
                {item.title}
              </h3>
              
              <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 black-white:text-gray-700 white-black:text-gray-400">
                <span>{item.source.title}</span>
                <span>•</span>
                <span>{formatTimeAgo(item.published_at)}</span>
              </div>

              {item.currencies && item.currencies.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.currencies.slice(0, 3).map((currency, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded-full bg-neon-cyan/20 text-neon-cyan font-semibold"
                    >
                      {currency.code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )))
        }
      </div>
    </section>
  );
}

export default NewsWidget;
