import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400 mr-2">Thema:</span>
      
      <button
        onClick={() => toggleTheme('dark')}
        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
          theme === 'dark' 
            ? 'bg-slate-700 text-white border border-neon-cyan' 
            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
        }`}
        aria-label="Dark mode"
      >
        🌙 Donker
      </button>
      
      <button
        onClick={() => toggleTheme('light')}
        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
          theme === 'light' 
            ? 'bg-slate-300 text-slate-800 border border-neon-purple' 
            : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50'
        }`}
        aria-label="Light mode"
      >
        ☀️ Licht
      </button>
      
      <button
        onClick={() => toggleTheme('high-contrast')}
        className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
          theme === 'high-contrast' 
            ? 'bg-yellow-400 text-black border-2 border-yellow-500 font-bold' 
            : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
        }`}
        aria-label="High contrast mode"
      >
        🔲 Hoog Contrast
      </button>
    </div>
  );
};

export default ThemeSwitcher;