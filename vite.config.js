import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  build: {
    target: 'ES2020',
    minify: 'terser',
    rollupOptions: {
      output: {
        // Automatic hash in filenames for cache-busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        
        // Manual chunk splitting for better caching
        manualChunks: {
          'chart-vendor': ['chart.js', 'react-chartjs-2', 'recharts', 'lightweight-charts'],
          'ui-vendor': ['react-beautiful-dnd'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      }
    }
  },

  // Pre-bundle heavy dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'chart.js',
      'react-chartjs-2',
      'react-beautiful-dnd',
      'axios',
    ],
  },
})
