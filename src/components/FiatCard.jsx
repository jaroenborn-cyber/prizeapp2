const FiatCard = ({ from, to, rate }) => {
  return (
    <div className="bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white rounded-xl p-5 shadow-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">{from}</span>
          <span className="text-slate-500 dark:text-slate-500 light:text-slate-400 high-contrast:text-gray-600">→</span>
          <span className="text-xl font-bold text-neon-purple dark:text-neon-purple light:text-neon-cyan high-contrast:text-high-contrast-accent">{to}</span>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 high-contrast:text-gray-600 mb-1">Exchange Rate</p>
        <p className="text-2xl font-bold text-white dark:text-white light:text-slate-800 high-contrast:text-black">
          {rate ? rate.toFixed(4) : 'N/A'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 high-contrast:text-gray-600 mt-1">1 {from} = {rate ? rate.toFixed(4) : 'N/A'} {to}</p>
      </div>
    </div>
  );
};

export default FiatCard;
