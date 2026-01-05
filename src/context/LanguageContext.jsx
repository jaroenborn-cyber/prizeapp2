import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const LanguageContext = createContext();
LanguageContext.displayName = 'LanguageContext';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load language from localStorage or default to 'nl' (Dutch)
    return localStorage.getItem('language') || 'nl';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({ language, setLanguage, toggleLanguage }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
