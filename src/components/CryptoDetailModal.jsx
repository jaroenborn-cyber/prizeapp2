import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CryptoDetailModal = ({ crypto, onClose }) => {
  const [timeRange, setTimeRange] = useState('24h');

  if (!crypto) return null;

  const priceChange24h = crypto.price_change_percentage_24h || 0;
  const priceChange7d = crypto.price_change_percentage_7d_in_currency || 0;
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

  const formatVolume = (volume) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toFixed(2)}`;
  };

  // Prepare chart data
  const sparklineData = crypto.sparkline_in_7d?.price || [];
  const chartData = timeRange === '24h' 
    ? sparklineData.slice(-24) 
    : sparklineData;

  const data = {
    labels: chartData.map((_, index) => ''),
    datasets: [
      {
        label: 'Price',
        data: chartData,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1e293b',
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
        borderColor: '#06b6d4',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        grid: {
          color: '#334155',
        },
        ticks: {
          color: '#94a3b8',
        },
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-dark-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-dark-card border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={crypto.image} alt={crypto.name} className="w-16 h-16 rounded-full" />
            <div>
              <h2 className="text-3xl font-bold text-white">{crypto.name}</h2>
              <p className="text-slate-400 uppercase">{crypto.symbol}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Price Info */}
          <div className="mb-8">
            <p className="text-sm text-slate-400 mb-2">Current Price</p>
            <p className="text-5xl font-bold text-white mb-4">
              ${formatPrice(crypto.current_price)}
            </p>
            <div className="flex gap-4">
              <div className={`px-4 py-2 rounded-lg ${isPositive24h ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <span className="font-semibold">
                  {isPositive24h ? '▲' : '▼'} {Math.abs(priceChange24h).toFixed(2)}% (24h)
                </span>
              </div>
              <div className={`px-4 py-2 rounded-lg ${isPositive7d ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                <span className="font-semibold">
                  {isPositive7d ? '▲' : '▼'} {Math.abs(priceChange7d).toFixed(2)}% (7d)
                </span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Price Chart</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeRange('24h')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === '24h'
                      ? 'bg-neon-cyan text-dark-bg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  24H
                </button>
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    timeRange === '7d'
                      ? 'bg-neon-cyan text-dark-bg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  7D
                </button>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 h-64">
              <Line data={data} options={options} />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">Market Cap</p>
              <p className="text-2xl font-bold text-white">{formatMarketCap(crypto.market_cap)}</p>
              <p className="text-xs text-slate-500 mt-1">Rank #{crypto.market_cap_rank}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">24h Volume</p>
              <p className="text-2xl font-bold text-white">{formatVolume(crypto.total_volume)}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">Circulating Supply</p>
              <p className="text-2xl font-bold text-white">
                {crypto.circulating_supply?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase">{crypto.symbol}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">24h High</p>
              <p className="text-2xl font-bold text-green-400">${formatPrice(crypto.high_24h)}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">24h Low</p>
              <p className="text-2xl font-bold text-red-400">${formatPrice(crypto.low_24h)}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6">
              <p className="text-sm text-slate-400 mb-2">All-Time High</p>
              <p className="text-2xl font-bold text-white">${formatPrice(crypto.ath)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CryptoDetailModal;
