const FiatCard = ({ from, to, rate }) => {
  return (
    <div className="bg-dark-card dark:bg-dark-card light:bg-white black-white:bg-white white-black:bg-black rounded-xl p-5 shadow-lg border border-slate-700 dark:border-slate-700 light:border-slate-300 black-white:border-black white-black:border-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white">{from}</span>
          <span className="text-slate-500 dark:text-slate-500 light:text-slate-400 black-white:text-gray-600 white-black:text-gray-400">→</span>
          <span className="text-xl font-bold text-neon-purple dark:text-neon-purple light:text-neon-cyan black-white:text-black white-black:text-white">{to}</span>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 black-white:text-gray-600 white-black:text-gray-400 mb-1">Exchange Rate</p>
        <p className="text-2xl font-bold text-white dark:text-white light:text-slate-800 black-white:text-black white-black:text-white">
          {rate ? rate.toFixed(4) : 'N/A'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-400 black-white:text-gray-600 white-black:text-gray-400 mt-1">1 {from} = {rate ? rate.toFixed(4) : 'N/A'} {to}</p>
      </div>
    </div>
  );
};

export default FiatCard;
