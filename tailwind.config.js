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
        // High-contrast mode: WCAG AAA compliant colors
        'high-contrast-bg': '#000000',
        'high-contrast-card': '#000000',
        'high-contrast-text': '#FFFFFF',
        'high-contrast-accent': '#FFD700', // Gold - high visibility
        'high-contrast-success': '#00FF00', // Lime green
        'high-contrast-warning': '#FFFF00', // Yellow
        'high-contrast-danger': '#FF0000', // Red
        'high-contrast-info': '#00FFFF', // Cyan
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
      addVariant('black-white', '.black-white &');
      addVariant('high-contrast-dark', '.high-contrast-dark &');
    })
  ],
  darkMode: 'class',
}
