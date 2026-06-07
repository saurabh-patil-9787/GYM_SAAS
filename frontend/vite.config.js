import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        name: "माझी जिम - Gym Management",
        short_name: "माझी जिम",
        description: "Smart gym management platform for members and owners",
        theme_color: "#4f46e5",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
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
          // Charts — ~75KB gzipped, only loaded on RevenuePage
          'vendor-charts': ['recharts'],
          // NOTE: framer-motion is NOT chunked here — it stays isolated
          // inside the lazy-loaded LandingPage chunk, so dashboard users
          // never download it.
        }
      }
    },
  },
})
