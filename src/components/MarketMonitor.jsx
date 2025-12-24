import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIndicesQuotes, getMarketStatus } from '../services/stockmarket';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

const MarketMonitor = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language];
  
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketStatus, setMarketStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Update market status every minute
    updateMarketStatus();
    const statusInterval = setInterval(updateMarketStatus, 60000);
    return () => clearInterval(statusInterval);
  }, []);

  const fetchData = async () => {
    try {
      const data = await getIndicesQuotes();
      setIndices(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching indices:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMarketStatus = () => {
    setMarketStatus(getMarketStatus());
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return '—';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatLargeNumber = (num) => {
    if (!num) return '—';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getRegionIndices = (region) => {
    return indices.filter(i => i.region === region);
  };

  const getRegionStatus = (region) => {
    if (!marketStatus) return null;
    switch (region) {
      case 'Europe': return marketStatus.europe;
      case 'Americas': return marketStatus.americas;
      case 'Asia-Pacific': return marketStatus.asiaPacific;
      default: return null;
    }
  };

  const RegionSection = ({ title, region, icon, gradient }) => {
    const regionIndices = getRegionIndices(region);
    const status = getRegionStatus(region);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black flex items-center gap-2">
            <span className={`text-2xl`}>{icon}</span>
            <span>{title}</span>
          </h2>
          {status && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              status.open 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-slate-700/50 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${status.open ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {status.status}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {regionIndices.map((index) => (
            <div key={index.symbol} onClick={() => navigate(`/market-monitor/${index.symbol}`)}>
              <IndexCard index={index} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const IndexCard = ({ index }) => {
    const isPositive = index.changesPercentage >= 0;
    const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
    const bgGradient = isPositive 
      ? 'from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-500/50' 
      : 'from-red-500/10 to-red-600/5 border-red-500/30 hover:border-red-500/50';
    
    return (
      <div className={`bg-gradient-to-br ${bgGradient} border rounded-xl p-4 transition-all hover:scale-[1.02] cursor-pointer`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{index.flag}</span>
            <div>
              <h3 className="font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                {index.name}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-600">
                {index.country}
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-1 ${changeColor}`}>
            {isPositive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
              {formatNumber(index.price)}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className={`text-lg font-semibold ${changeColor}`}>
              {isPositive ? '+' : ''}{formatNumber(index.changesPercentage)}%
            </span>
            <span className={`text-sm ${changeColor}`}>
              {isPositive ? '+' : ''}{formatNumber(index.change)}
            </span>
          </div>
          
          {index.dayHigh && index.dayLow && (
            <div className="pt-2 border-t border-slate-700/50 dark:border-slate-700/50 light:border-slate-200 high-contrast:border-gray-400">
              <div className="flex justify-between text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-600">
                <span>L: {formatNumber(index.dayLow)}</span>
                <span>H: {formatNumber(index.dayHigh)}</span>
              </div>
              {/* Range bar */}
              <div className="mt-1 h-1.5 bg-slate-700/50 dark:bg-slate-700/50 light:bg-slate-200 high-contrast:bg-gray-300 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${isPositive ? 'bg-green-500' : 'bg-red-500'} rounded-full`}
                  style={{
                    width: `${((index.price - index.dayLow) / (index.dayHigh - index.dayLow)) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-full">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-700/50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black flex items-center gap-3">
            <span className="text-3xl">📊</span>
            {t.marketMonitor || 'Market Monitor'}
          </h1>
          <p className="text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 text-sm mt-1">
            {t.marketMonitorDesc || 'Real-time global stock market indices'}
          </p>
        </div>
        
        {lastUpdate && (
          <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.lastUpdate || 'Last update'}: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {['Europe', 'Americas', 'Asia-Pacific'].map((region) => {
          const regionIndices = getRegionIndices(region);
          const avgChange = regionIndices.length > 0 
            ? regionIndices.reduce((sum, i) => sum + (i.changesPercentage || 0), 0) / regionIndices.length 
            : 0;
          const isPositive = avgChange >= 0;
          const status = getRegionStatus(region);
          const icon = region === 'Europe' ? '🇪🇺' : region === 'Americas' ? '🌎' : '🌏';
          
          return (
            <div 
              key={region}
              className={`bg-gradient-to-br ${
                isPositive ? 'from-green-500/20 to-green-600/10' : 'from-red-500/20 to-red-600/10'
              } border ${
                isPositive ? 'border-green-500/30' : 'border-red-500/30'
              } rounded-xl p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                {status && (
                  <span className={`w-2 h-2 rounded-full ${status.open ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></span>
                )}
              </div>
              <h3 className="font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
                {region}
              </h3>
              <p className={`text-2xl font-bold mt-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{avgChange.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {t.averageChange || 'Average change'}
              </p>
            </div>
          );
        })}
      </div>

      {/* Regional Sections */}
      <RegionSection 
        title={t.europe || 'Europe'} 
        region="Europe" 
        icon="🇪🇺" 
        gradient="from-blue-500 to-blue-600"
      />
      
      <RegionSection 
        title={t.americas || 'Americas'} 
        region="Americas" 
        icon="🌎" 
        gradient="from-purple-500 to-purple-600"
      />
      
      <RegionSection 
        title={t.asiaPacific || 'Asia-Pacific'} 
        region="Asia-Pacific" 
        icon="🌏" 
        gradient="from-orange-500 to-orange-600"
      />

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-slate-800/30 dark:bg-slate-800/30 light:bg-slate-100 high-contrast:bg-gray-100 rounded-xl border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-gray-400">
        <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            {t.marketDataNote || 'Market data provided by Financial Modeling Prep. Data may be delayed up to 15 minutes during market hours.'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketMonitor;
