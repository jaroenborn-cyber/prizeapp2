import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const AdvancedChart = ({ crypto, theme = 'dark' }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('line'); // line, candlestick, area
  const [showVolume, setShowVolume] = useState(false);
  const [showMA, setShowMA] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || !crypto) return;

    // Color schemes based on theme
    const colors = {
      dark: {
        background: '#1e293b',
        text: '#94a3b8',
        grid: '#334155',
        up: '#22c55e',
        down: '#ef4444',
        line: '#06b6d4',
      },
      light: {
        background: '#f8fafc',
        text: '#64748b',
        grid: '#e2e8f0',
        up: '#22c55e',
        down: '#ef4444',
        line: '#8b5cf6',
      },
      'high-contrast': {
        background: '#ffffff',
        text: '#000000',
        grid: '#cccccc',
        up: '#00ff00',
        down: '#ff0000',
        line: '#ffff00',
      }
    };

    const currentColors = colors[theme] || colors.dark;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: currentColors.background },
        textColor: currentColors.text,
      },
      grid: {
        vertLines: { color: currentColors.grid },
        horzLines: { color: currentColors.grid },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: currentColors.grid,
      },
      timeScale: {
        borderColor: currentColors.grid,
      },
    });

    chartRef.current = chart;

    // Prepare data
    const sparklineData = crypto.sparkline_in_7d?.price || [];
    const dataPoints = timeRange === '1h' 
      ? sparklineData.slice(-12)
      : timeRange === '12h'
      ? sparklineData.slice(-72)
      : timeRange === '24h'
      ? sparklineData.slice(-24)
      : timeRange === '7d'
      ? sparklineData
      : sparklineData;

    const now = Math.floor(Date.now() / 1000);
    const interval = timeRange === '1h' ? 300 : timeRange === '12h' ? 600 : 3600;

    const chartData = dataPoints.map((price, index) => ({
      time: now - (dataPoints.length - index) * interval,
      value: price,
    }));

    // Add series based on chart type
    let series;
    if (chartType === 'candlestick') {
      // For candlestick, we need to simulate OHLC from single price
      series = chart.addCandlestickSeries({
        upColor: currentColors.up,
        downColor: currentColors.down,
        borderUpColor: currentColors.up,
        borderDownColor: currentColors.down,
        wickUpColor: currentColors.up,
        wickDownColor: currentColors.down,
      });
      
      const candleData = chartData.map((point, index) => {
        const prev = index > 0 ? chartData[index - 1].value : point.value;
        const volatility = point.value * 0.002; // 0.2% volatility
        return {
          time: point.time,
          open: prev,
          high: point.value + volatility,
          low: point.value - volatility,
          close: point.value,
        };
      });
      series.setData(candleData);
    } else if (chartType === 'area') {
      series = chart.addAreaSeries({
        topColor: currentColors.line + '80',
        bottomColor: currentColors.line + '00',
        lineColor: currentColors.line,
        lineWidth: 2,
      });
      series.setData(chartData);
    } else {
      series = chart.addLineSeries({
        color: currentColors.line,
        lineWidth: 2,
      });
      series.setData(chartData);
    }

    // Add Moving Average if enabled
    if (showMA && chartData.length > 20) {
      const maSeries = chart.addLineSeries({
        color: currentColors.up,
        lineWidth: 1,
        lineStyle: 2, // dashed
      });

      const ma20Data = chartData.map((point, index) => {
        if (index < 19) return null;
        const sum = chartData.slice(index - 19, index + 1).reduce((acc, p) => acc + p.value, 0);
        return {
          time: point.time,
          value: sum / 20,
        };
      }).filter(p => p !== null);

      maSeries.setData(ma20Data);
    }

    // Add Volume if enabled
    if (showVolume && crypto.total_volume) {
      const volumeSeries = chart.addHistogramSeries({
        color: currentColors.line + '40',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
      });

      chart.priceScale('volume').applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      // Generate volume data (simplified)
      const volumeData = chartData.map(point => ({
        time: point.time,
        value: crypto.total_volume / dataPoints.length * (0.8 + Math.random() * 0.4),
        color: currentColors.line + '40',
      }));

      volumeSeries.setData(volumeData);
    }

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [crypto, timeRange, chartType, showVolume, showMA, theme]);

  return (
    <div className="w-full">
      {/* Controls */}
      <div className="mb-4 space-y-3">
        {/* Timeframe Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mr-2 self-center">Timeframe:</span>
          {['1h', '12h', '24h', '7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-neon-cyan text-dark-bg dark:bg-neon-cyan dark:text-dark-bg light:bg-neon-purple light:text-white high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Chart Type Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mr-2 self-center">Chart Type:</span>
          {[
            { value: 'line', label: '📈 Line', icon: '📈' },
            { value: 'candlestick', label: '🕯️ Candles', icon: '🕯️' },
            { value: 'area', label: '📊 Area', icon: '📊' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setChartType(type.value)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                chartType === type.value
                  ? 'bg-neon-cyan text-dark-bg dark:bg-neon-cyan dark:text-dark-bg light:bg-neon-purple light:text-white high-contrast:bg-yellow-400 high-contrast:text-black'
                  : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Indicators */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 high-contrast:text-gray-700 mr-2 self-center">Indicators:</span>
          <button
            onClick={() => setShowMA(!showMA)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              showMA
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
            }`}
          >
            MA(20)
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              showVolume
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 dark:bg-slate-700 light:bg-slate-200 high-contrast:bg-gray-200 text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-gray-800 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-slate-300 high-contrast:hover:bg-gray-300'
            }`}
          >
            Volume
          </button>
        </div>
      </div>

      {/* Chart */}
      <div 
        ref={chartContainerRef} 
        className="rounded-xl overflow-hidden border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black"
      />
    </div>
  );
};

export default AdvancedChart;
