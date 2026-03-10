import ui from '@nuxt/ui/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import vueRouter from 'vue-router/vite'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    exclude: ['supabase/**', 'node_modules/**'],
  },
  plugins: [
    vueRouter({
      dts: 'src/route-map.d.ts',
    }),
    vue(),
    ui({
      ui: {
        colors: {
          primary: 'green',
          neutral: 'zinc',
        },
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Calimove',
        short_name: 'Calimove',
        description: 'Your Cali Move Mobility 2.0 companion',
        theme_color: '#22c55e',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/favicon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/icons/favicon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Pre-cache all built assets + audio
        globPatterns: ['**/*.{js,css,html,png,svg,mp3,woff,woff2}'],
        // Offline SPA fallback
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Exercise images from Supabase Storage
          {
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Fonts from bunny.net
          {
            urlPattern: /^https:\/\/fonts\.bunny\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
