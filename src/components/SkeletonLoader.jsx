const SkeletonLoader = ({ count = 1, type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, index) => (
          <div 
            key={index} 
            className="bg-dark-card rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
                <div>
                  <div className="h-4 bg-slate-700 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded w-12"></div>
                </div>
              </div>
            </div>
            <div className="h-6 bg-slate-700 rounded w-24 mb-2"></div>
            <div className="h-4 bg-slate-700 rounded w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'converter') {
    return (
      <div className="bg-dark-card rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-48 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
          <div className="h-12 bg-slate-700 rounded"></div>
        </div>
        <div className="h-16 bg-slate-700 rounded mt-4"></div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
