import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LanguageSwitcher = () => {
  const { language, toggleLanguage } = useLanguage();
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

  const getLanguageFlag = () => {
    return language === 'nl' ? '🇳🇱' : '🇬🇧';
  };

  const getLanguageLabel = () => {
    return language === 'nl' ? 'Nederlands' : 'English';
  };

  const handleLanguageSelect = (selectedLanguage) => {
    toggleLanguage(selectedLanguage);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="switcher-btn flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white black-white:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black black-white:border-black hover:border-neon-purple dark:hover:border-neon-purple light:hover:border-slate-400 high-contrast:hover:border-gray-600 black-white:hover:border-gray-600 transition-all text-white dark:text-white light:text-slate-800 high-contrast:text-black black-white:text-black shadow-lg hover:shadow-neon-purple/20"
        aria-label="Language selector"
      >
        <span className="text-base sm:text-lg">{getLanguageFlag()}</span>
        <span className="font-medium text-sm sm:text-base hidden sm:inline">{getLanguageLabel()}</span>
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
        <div className="switcher-dropdown absolute left-0 sm:left-auto sm:right-0 mt-2 w-32 sm:w-48 rounded-lg bg-dark-card dark:bg-dark-card light:bg-white high-contrast:bg-white black-white:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 high-contrast:border-black black-white:border-black shadow-2xl overflow-hidden z-50 animate-fadeIn">
          <div className="py-1">
            <button
              onClick={() => handleLanguageSelect('nl')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all text-xs sm:text-base ${
                language === 'nl'
                  ? 'bg-slate-700 text-white border-l-4 border-orange-500'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-black black-white:text-black hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 black-white:hover:bg-gray-100'
              }`}
            >
              <span className="text-base sm:text-2xl">🇳🇱</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">NL</div>
              </div>
              {language === 'nl' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            <button
              onClick={() => handleLanguageSelect('en')}
              className={`dropdown-item w-full px-2 sm:px-4 py-1.5 sm:py-3 flex items-center gap-1.5 sm:gap-3 transition-all text-xs sm:text-base ${
                language === 'en'
                  ? 'bg-slate-700 text-white border-l-4 border-blue-500'
                  : 'text-slate-300 dark:text-slate-300 light:text-slate-700 high-contrast:text-black black-white:text-black hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 high-contrast:hover:bg-gray-100 black-white:hover:bg-gray-100'
              }`}
            >
              <span className="text-base sm:text-2xl">🇬🇧</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-xs sm:text-base">EN</div>
              </div>
              {language === 'en' && (
                <svg className="w-3 h-3 sm:w-5 sm:h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
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

export default LanguageSwitcher;
