import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Target modern browsers — avoids legacy JS transforms (fixes Lighthouse warning)
    target: 'es2020',
    // Do NOT expose source maps in production
    sourcemap: false,
    // Suppress noisy warnings for optimized chunks
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core framework — changes rarely, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // HTTP client — tiny but changes independently
          'vendor-axios': ['axios'],
          // UI utilities — icons, classname helpers
          'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
          // NOTE: framer-motion is NOT chunked here — it stays isolated
          // inside the lazy-loaded LandingPage chunk, so dashboard users
          // never download it.
        }
      }
    },
  },
})
