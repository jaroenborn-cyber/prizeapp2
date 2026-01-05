import { Component } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

class ErrorBoundaryCore extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retries: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  retry = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      retries: this.state.retries + 1 
    });
  };

  render() {
    if (this.state.hasError) {
      const { theme, language } = this.props;
      const isDark = theme === 'dark' || theme === 'black-white';
      
      return (
        <div 
          role="alert" 
          className={`flex flex-col items-center justify-center min-h-[400px] p-6 rounded-lg ${
            isDark 
              ? 'bg-slate-800/50 border border-red-500/30' 
              : 'bg-white border border-red-300'
          }`}
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`text-xl font-bold mb-2 ${
            isDark ? 'text-red-400' : 'text-red-600'
          }`}>
            {language === 'nl' ? 'Er is iets misgegaan' : 'Something went wrong'}
          </h2>
          <p className={`text-center mb-6 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {language === 'nl' 
              ? 'Fout bij laden van cryptocurrency data' 
              : 'Error loading cryptocurrency data'}
          </p>
          
          {this.state.retries > 0 && (
            <p className={`text-sm mb-4 ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              {language === 'nl' ? 'Pogingen' : 'Attempts'}: {this.state.retries}
            </p>
          )}

          <button 
            onClick={this.retry}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
          >
            {language === 'nl' ? '🔄 Opnieuw proberen' : '🔄 Try again'}
          </button>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-6 text-xs text-left w-full max-w-2xl">
              <summary className={`cursor-pointer ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Error details (dev only)
              </summary>
              <pre className={`mt-2 p-4 rounded overflow-auto ${
                isDark ? 'bg-slate-900 text-red-300' : 'bg-slate-100 text-red-700'
              }`}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to use hooks with class component
export default function ErrorBoundary({ children }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  return (
    <ErrorBoundaryCore theme={theme} language={language}>
      {children}
    </ErrorBoundaryCore>
  );
}
