import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'EPC Estimator',
        short_name: 'EPC Estimator',
        description: 'Get an estimated Energy Performance Certificate rating for your home in minutes',
        theme_color: '#1a3a5c',
        background_color: '#1a3a5c',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/epc-app/',
        start_url: '/epc-app/',
        icons: [
          { src: '/epc-app/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/epc-app/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/epc-app/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        navigateFallback: '/epc-app/index.html',
      },
    }),
  ],
  base: '/epc-app/',
})
