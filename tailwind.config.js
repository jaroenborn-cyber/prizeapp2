/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0f172a',
        'dark-card': '#1e293b',
        'light-bg': '#f8fafc',
        'light-card': '#ffffff',
        'high-contrast-bg': '#000000',
        'high-contrast-card': '#ffffff',
        'high-contrast-text': '#ffffff',
        'high-contrast-accent': '#ffff00',
        'neon-cyan': '#06b6d4',
        'neon-purple': '#a855f7',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('light', '.light &');
      addVariant('high-contrast', '.high-contrast &');
    })
  ],
  darkMode: 'class',
}
