import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-leaflet', 'leaflet', '@supabase/supabase-js'],
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendors into stable chunks for better long-term
        // caching. Heavy libs (ogl, leaflet, gsap, motion) are already isolated
        // via dynamic import, so we only group the always-loaded core here.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/react-router') ||
            id.includes('/scheduler/')
          ) {
            return 'react-vendor'
          }
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor'
          }
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      jpg: { quality: 75 },
      jpeg: { quality: 75 },
      png: { quality: 80 },
      webp: { quality: 75 },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'icons/*.png'],
      workbox: {
        globIgnores: ['**/*.mp4'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Wastra - Smart Tourism Platform',
        short_name: 'Wastra',
        description: 'Platform Pariwisata Cerdas Indonesia',
        theme_color: '#00647c',
        background_color: '#fff8f5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
