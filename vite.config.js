import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
let visualizerPlugin
try {
  visualizerPlugin = (await import('rollup-plugin-visualizer')).visualizer
} catch {
  visualizerPlugin = null
}
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: '/startpage/',
  optimizeDeps: {
    entries: ['index.html'],
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'vendor-react'
          if (id.includes('node_modules/marked') || id.includes('node_modules/@mozilla')) return 'vendor-content'
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: false,
  },
  plugins: [
    react(),
    process.env.ANALYZE && visualizerPlugin?.({ open: true, filename: 'dist/stats.html' }),
    {
      name: 'rss-proxy',
      configureServer(server) {
        server.middlewares.use('/api/rss-proxy', async (req, res) => {
          const search = req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
          const params = new URLSearchParams(search)
          const target = params.get('url')
          if (!target) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'text/plain')
            res.end('Missing url parameter')
            return
          }
          try {
            const response = await fetch(decodeURIComponent(target))
            const text = await response.text()
            res.setHeader('Content-Type', 'text/xml; charset=utf-8')
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.end(text)
          } catch {
            res.statusCode = 502
            res.setHeader('Content-Type', 'text/plain')
            res.end('Proxy fetch failed')
          }
        })
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        globIgnores: ['emulator/**'],
        navigateFallback: '/startpage/',
        navigateFallbackDenylist: [/\/emulator\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/api\/weather\//i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 30 },
            },
          },
          {
            urlPattern: /\/api\/rss-proxy/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rss-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 15 },
            },
          },
        ],
      },
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'GFcode',
        short_name: 'GFcode',
        description: 'curated by creative stations',
        theme_color: '#0f0b0a',
        background_color: '#0f0b0a',
        display: 'standalone',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-192x192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    environmentOptions: {
      jsdom: {
        url: 'http://localhost',
      },
    },
  },
})
