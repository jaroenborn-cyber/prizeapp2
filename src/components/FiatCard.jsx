const FiatCard = ({ from, to, rate }) => {
  return (
    <div className="bg-dark-card rounded-xl p-5 shadow-lg border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">{from}</span>
          <span className="text-slate-500">→</span>
          <span className="text-xl font-bold text-neon-purple">{to}</span>
        </div>
      </div>
      
      <div>
        <p className="text-sm text-slate-400 mb-1">Exchange Rate</p>
        <p className="text-2xl font-bold text-white">
          {rate ? rate.toFixed(4) : 'N/A'}
        </p>
        <p className="text-xs text-slate-500 mt-1">1 {from} = {rate ? rate.toFixed(4) : 'N/A'} {to}</p>
      </div>
    </div>
  );
};

export default FiatCard;
