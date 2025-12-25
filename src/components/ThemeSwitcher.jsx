import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = () => {
    switch(theme) {
      case 'dark': return '🌙';
      case 'light': return '☀️';
      case 'high-contrast': return '🔲';
      case 'black-white': return '◐';
      case 'high-contrast-dark': return '🔳';
      default: return '🌙';
    }
  };

  const getThemeLabel = () => {
    switch(theme) {
      case 'dark': return 'Donker';
      case 'light': return 'Licht';
      case 'high-contrast': return 'Hoog Contrast';
      case 'black-white': return 'Zwart-Wit';
      case 'high-contrast-dark': return 'HC Dark';
      default: return 'Donker';
    }
  };

  const handleThemeSelect = (selectedTheme) => {
    toggleTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="switcher-btn flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black black-white:bg-white high-contrast-dark:bg-black border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white black-white:border-black high-contrast-dark:border-lime-500 hover:border-neon-cyan dark:hover:border-neon-cyan light:hover:border-slate-400 high-contrast:hover:border-high-contrast-accent black-white:hover:border-gray-600 high-contrast-dark:hover:border-lime-400 transition-all text-white dark:text-white light:text-slate-800 high-contrast:text-white black-white:text-black high-contrast-dark:text-lime-500 shadow-lg hover:shadow-neon-cyan/20"
        aria-label="Theme selector"
      >
        <span className="text-base sm:text-lg">{getThemeIcon()}</span>
        <span className="font-medium text-sm sm:text-base hidden sm:inline">{getThemeLabel()}</span>
        <svg 
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="switcher-dropdown absolute left-0 sm:left-auto sm:right-0 mt-2 w-36 sm:w-56 rounded-lg bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-black black-white:bg-white high-contrast-dark:bg-black border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-white black-white:border-black high-contrast-dark:border-lime-500 shadow-2xl overflow-hidden z-50 animate-fadeIn">
          <div className="py-1">
            <button
              onClick={() => handleThemeSelect('dark')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all ${
                theme === 'dark'
                  ? 'bg-slate-700 text-white border-l-4 border-neon-cyan'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-white black-white:text-black high-contrast-dark:text-lime-500 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-800 black-white:hover:bg-gray-100 high-contrast-dark:hover:bg-gray-900'
              }`}
            >
              <span className="text-base sm:text-2xl">🌙</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">Donker</div>
                <div className="text-xs opacity-70 hidden sm:block">Standaard donkere modus</div>
              </div>
              {theme === 'dark' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleThemeSelect('light')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all ${
                theme === 'light'
                  ? 'bg-slate-200 text-slate-800 border-l-4 border-neon-purple'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-white black-white:text-black high-contrast-dark:text-lime-500 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-800 black-white:hover:bg-gray-100 high-contrast-dark:hover:bg-gray-900'
              }`}
            >
              <span className="text-base sm:text-2xl">☀️</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">Licht</div>
                <div className="text-xs opacity-70 hidden sm:block">Heldere lichte modus</div>
              </div>
              {theme === 'light' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-neon-purple" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleThemeSelect('high-contrast')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all ${
                theme === 'high-contrast'
                  ? 'bg-yellow-400 text-black border-l-4 border-yellow-600 font-bold'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-white black-white:text-black high-contrast-dark:text-lime-500 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-800 black-white:hover:bg-gray-100 high-contrast-dark:hover:bg-gray-900'
              }`}
            >
              <span className="text-base sm:text-2xl">🔲</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">Contrast</div>
                <div className="text-xs opacity-70 hidden sm:block">Voor toegankelijkheid</div>
              </div>
              {theme === 'high-contrast' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleThemeSelect('black-white')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all ${
                theme === 'black-white'
                  ? 'bg-gray-200 text-black border-l-4 border-black font-bold'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-white black-white:text-black high-contrast-dark:text-lime-500 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-800 black-white:hover:bg-gray-100 high-contrast-dark:hover:bg-gray-900'
              }`}
            >
              <span className="text-base sm:text-2xl">◐</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">Zwart-Wit</div>
                <div className="text-xs opacity-70 hidden sm:block">Geen kleuren</div>
              </div>
              {theme === 'black-white' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleThemeSelect('high-contrast-dark')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all ${
                theme === 'high-contrast-dark'
                  ? 'bg-lime-500 text-black border-l-4 border-lime-700 font-bold'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-white black-white:text-black high-contrast-dark:text-lime-500 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-800 black-white:hover:bg-gray-100 high-contrast-dark:hover:bg-gray-900'
              }`}
            >
              <span className="text-base sm:text-2xl">🔳</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">HC Dark</div>
                <div className="text-xs opacity-70 hidden sm:block">Groen op zwart</div>
              </div>
              {theme === 'high-contrast-dark' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;