import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { getNewsArchive, getArchiveCount } from '../services/newsApi';

function NewsPage() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [archive, setArchive] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [filter, setFilter] = useState('all'); // all, news, media, blog
  const [sortBy, setSortBy] = useState('date'); // date, votes
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadArchive();
  }, [filter, sortBy]);

  const loadArchive = async () => {
    try {
      setLoading(true);
      const [data, count] = await Promise.all([
        getNewsArchive(filter, sortBy, 1000, 0),
        getArchiveCount()
      ]);
      setArchive(data);
      setTotalCount(count);
    } catch (err) {
      console.error('Error loading archive:', err);
      setArchive([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
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

  // Backend handles filtering and sorting
  const filteredNews = archive;

  return (
    <>
      <div className="min-h-screen w-full px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">
              {language === 'nl' ? '📰 Nieuws Archief' : '📰 News Archive'}
            </span>
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-600 white-black:text-gray-400">
            {language === 'nl' 
              ? `${totalCount} nieuwsberichten in archief` 
              : `${totalCount} news items in archive`}
          </p>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-neon-cyan text-white'
                  : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300'
              }`}
            >
              {language === 'nl' ? 'Alles' : 'All'}
            </button>
            <button
              onClick={() => setFilter('news')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'news'
                  ? 'bg-neon-cyan text-white'
                  : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300'
              }`}
            >
              {language === 'nl' ? 'Nieuws' : 'News'}
            </button>
            <button
              onClick={() => setFilter('media')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'media'
                  ? 'bg-neon-cyan text-white'
                  : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300'
              }`}
            >
              Media
            </button>
            <button
              onClick={() => setFilter('blog')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'blog'
                  ? 'bg-neon-cyan text-white'
                  : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-slate-300'
              }`}
            >
              Blog
            </button>
          </div>

          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setSortBy('date')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === 'date'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700'
              }`}
            >
              📅 {language === 'nl' ? 'Datum' : 'Date'}
            </button>
            <button
              onClick={() => setSortBy('votes')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sortBy === 'votes'
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-200 black-white:bg-gray-200 white-black:bg-gray-800 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white hover:bg-slate-700'
              }`}
            >
              ⭐ {language === 'nl' ? 'Populariteit' : 'Popular'}
            </button>
          </div>
        </div>

        {/* News Grid */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-600 white-black:text-gray-400">
              {language === 'nl' ? 'Laden...' : 'Loading...'}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-600 white-black:text-gray-400">
              {language === 'nl' ? 'Geen nieuwsberichten gevonden' : 'No news items found'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNews.map((item, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedNews(item)}
                  className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black border border-slate-800 dark:border-slate-800 light:border-slate-300 black-white:border-black white-black:border-white rounded-xl p-4 hover:border-neon-cyan dark:hover:border-neon-cyan light:hover:border-neon-cyan black-white:hover:border-black white-black:hover:border-white transition-all cursor-pointer group"
                >
                  <div className="flex flex-col h-full">
                    {/* Kind Badge */}
                    {item.kind && (
                      <span className="inline-block px-2 py-1 text-xs bg-purple-500/10 text-purple-400 rounded-md mb-2 w-fit capitalize">
                        {item.kind}
                      </span>
                    )}

                    <h3 className="font-semibold text-sm mb-2 text-slate-100 dark:text-slate-100 light:text-slate-900 black-white:text-black white-black:text-white group-hover:text-neon-cyan dark:group-hover:text-neon-cyan light:group-hover:text-neon-cyan black-white:group-hover:text-black white-black:group-hover:text-white line-clamp-3">
                      {item.title}
                    </h3>
                    
                    {/* Votes */}
                    {item.votes && (item.votes.positive > 0 || item.votes.important > 0) && (
                      <div className="flex gap-3 mb-2 text-xs">
                        {item.votes.positive > 0 && (
                          <span className="text-green-400">👍 {item.votes.positive}</span>
                        )}
                        {item.votes.important > 0 && (
                          <span className="text-orange-400">⭐ {item.votes.important}</span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-col gap-1 mt-auto pt-2 text-xs text-slate-500 dark:text-slate-500 light:text-slate-600 black-white:text-gray-700 white-black:text-gray-400">
                      <div className="flex items-center gap-2">
                        <span>{item.source?.title || 'CryptoPanic'}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(item.published_at)}</span>
                      </div>
                      <div className="text-slate-600 dark:text-slate-600 light:text-slate-500 black-white:text-gray-600 white-black:text-gray-500">
                        {new Date(item.published_at).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {item.currencies && item.currencies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.currencies.slice(0, 4).map((currency, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded text-xs"
                          >
                            {currency.code}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* News Detail Modal (reuse from NewsWidget) */}
      {selectedNews && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNews(null)}
        >
          <div 
            className="bg-slate-900 dark:bg-slate-900 light:bg-white black-white:bg-white white-black:bg-black rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900/95 dark:bg-slate-900/95 light:bg-white/95 black-white:bg-white/95 white-black:bg-black/95 backdrop-blur-sm border-b border-slate-800 dark:border-slate-800 light:border-slate-300 black-white:border-black white-black:border-white p-6 flex justify-between items-start">
              <h2 className="text-xl font-bold text-slate-100 dark:text-slate-100 light:text-slate-900 black-white:text-black white-black:text-white pr-4">
                {selectedNews.title}
              </h2>
              <button
                onClick={() => setSelectedNews(null)}
                className="p-2 rounded-full hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 black-white:hover:bg-gray-100 white-black:hover:bg-gray-900 transition-colors flex-shrink-0"
              >
                <svg className="w-6 h-6 text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-black white-black:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-3 py-1 bg-neon-cyan/10 text-neon-cyan rounded-full">
                  {selectedNews.source?.title || 'CryptoPanic'}
                </span>
                {selectedNews.source?.domain && (
                  <span className="text-slate-500 dark:text-slate-500 light:text-slate-500 black-white:text-gray-500 white-black:text-gray-500">
                    {selectedNews.source.domain}
                  </span>
                )}
                {selectedNews.kind && (
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full capitalize">
                    {selectedNews.kind}
                  </span>
                )}
                <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-600 white-black:text-gray-400">
                  {new Date(selectedNews.published_at).toLocaleDateString(language === 'nl' ? 'nl-NL' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {selectedNews.votes && (selectedNews.votes.positive > 0 || selectedNews.votes.important > 0) && (
                <div className="flex gap-4 text-sm">
                  {selectedNews.votes.positive > 0 && (
                    <div className="flex items-center gap-1 text-green-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{selectedNews.votes.positive} {language === 'nl' ? 'positief' : 'positive'}</span>
                    </div>
                  )}
                  {selectedNews.votes.important > 0 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{selectedNews.votes.important} {language === 'nl' ? 'belangrijk' : 'important'}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedNews.currencies && selectedNews.currencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 black-white:text-gray-600 white-black:text-gray-400 mb-2">
                    {language === 'nl' ? 'Gerelateerde Crypto' : 'Related Cryptocurrencies'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedNews.currencies.map((currency, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-slate-800 dark:bg-slate-800 light:bg-slate-100 black-white:bg-gray-100 white-black:bg-gray-900 text-slate-300 dark:text-slate-300 light:text-slate-700 black-white:text-black white-black:text-white rounded-lg text-sm font-medium"
                      >
                        {currency.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-300 black-white:border-gray-300 white-black:border-gray-700">
                <a
                  href={selectedNews.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-neon-cyan/20 transition-all"
                >
                  <span>{language === 'nl' ? 'Lees meer op externe site' : 'Read more on external site'}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default NewsPage;
