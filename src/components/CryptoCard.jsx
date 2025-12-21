const CryptoCard = ({ crypto, onClick }) => {
  const priceChange24h = crypto.price_change_percentage_24h || 0;
  const isPositive = priceChange24h >= 0;

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
    <div
      onClick={() => onClick(crypto)}
      className="bg-dark-card rounded-xl p-5 shadow-lg border border-slate-700 hover:border-neon-cyan transition-all cursor-pointer hover:scale-105 duration-200"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={crypto.image} alt={crypto.name} className="w-10 h-10 rounded-full" />
          <div>
            <h3 className="font-bold text-white">{crypto.name}</h3>
            <p className="text-sm text-slate-400 uppercase">{crypto.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {crypto.isLive && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
          <span className="text-xs bg-slate-700 px-2 py-1 rounded">#{crypto.market_cap_rank}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-2xl font-bold text-white">${formatPrice(crypto.current_price)}</p>
        <p className="text-sm text-slate-400">USD</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">24h Change</p>
          <p className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 mb-1">Market Cap</p>
          <p className="font-semibold text-slate-300">{formatMarketCap(crypto.market_cap)}</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoCard;
