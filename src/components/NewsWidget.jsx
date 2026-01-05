import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

function NewsWidget() {
  const { language } = useLanguage();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoNews();
  }, []);

  const fetchCryptoNews = async () => {
    try {
      // Using CoinGecko trending/search trending coins as "news"
      const response = await fetch('https://api.coingecko.com/api/v3/search/trending');
      const data = await response.json();
      
      // Transform trending coins into news-like items
      const trendingNews = data.coins.slice(0, 6).map((item) => ({
        title: `${item.item.name} (${item.item.symbol}) - Trending #${item.item.market_cap_rank || 'N/A'}`,
        url: `https://www.coingecko.com/en/coins/${item.item.id}`,
        source: { title: 'CoinGecko' },
        published_at: new Date().toISOString(),
        score: item.item.score,
        crypto: item.item.symbol.toUpperCase(),
        description: `Market Cap Rank: #${item.item.market_cap_rank || 'N/A'} • Price BTC: ${item.item.price_btc.toFixed(8)}`
      }));
      
      setNews(trendingNews);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch trending:', error);
      setLoading(false);
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
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
          {language === 'nl' ? '🔥 Trending Crypto' : '🔥 Trending Crypto'}
        </span>
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {news.map((item, index) => (
          <div
            key={index}
            onClick={() => window.open(item.url, '_blank', 'noopener,noreferrer')}
            className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black border border-slate-800 dark:border-slate-800 light:border-slate-300 black-white:border-black white-black:border-white rounded-xl p-4 hover:border-neon-cyan dark:hover:border-neon-cyan light:hover:border-neon-cyan black-white:hover:border-black white-black:hover:border-white transition-all cursor-pointer group"
          >
            <div className="flex flex-col h-full">
              <h3 className="font-semibold text-sm mb-2 text-slate-100 dark:text-slate-100 light:text-slate-900 black-white:text-black white-black:text-white group-hover:text-neon-cyan dark:group-hover:text-neon-cyan light:group-hover:text-neon-cyan black-white:group-hover:text-black white-black:group-hover:text-white line-clamp-2">
                {item.title}
              </h3>
              
              {item.description && (
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-700 white-black:text-gray-400 mb-2">
                  {item.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-auto pt-2 text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 black-white:text-gray-700 white-black:text-gray-400">
                <span>{item.source.title}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-neon-cyan/20 text-neon-cyan font-semibold">
                  {item.crypto}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default NewsWidget;
