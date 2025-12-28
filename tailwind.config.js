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
      addVariant('black-white', '.black-white &');
      addVariant('white-black', '.white-black &');
    })
  ],
  darkMode: 'class',
}
