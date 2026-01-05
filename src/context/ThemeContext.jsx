import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();
ThemeContext.displayName = 'ThemeContext';

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'dark'
    return localStorage.getItem('theme') || 'dark';
  });

  // Apply theme class to document body
  useEffect(() => {
    // Remove all theme classes from both html and body
    document.documentElement.classList.remove('dark', 'light', 'black-white', 'white-black');
    document.body.classList.remove('dark', 'light', 'black-white', 'white-black');
    
    // Add current theme class to both html and body
    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  // Memoize value to prevent unnecessary re-renders
  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};