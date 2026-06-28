import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

/// <reference types="vitest" />

function proxyPlugin(): import('vite').Plugin {
  return {
    name: 'dev-proxy',
    configureServer(server) {
      async function proxy(req: import('http').IncomingMessage, res: import('http').ServerResponse, type: 'xml' | 'html') {
        const url = new URL(req.url!, 'http://localhost')
        const target = url.searchParams.get('url')
        if (!target) {
          res.statusCode = 400
          res.end('Missing url')
          return
        }
        try {
          const controller = new AbortController()
          const timeout = setTimeout(() => controller.abort(), type === 'xml' ? 10000 : 15000)
          const response = await fetch(target, { signal: controller.signal, redirect: 'follow' })
          clearTimeout(timeout)
          const text = await response.text()
          res.setHeader('content-type', type === 'xml' ? 'text/xml; charset=utf-8' : 'text/html; charset=utf-8')
          res.setHeader('access-control-allow-origin', '*')
          res.end(text)
        } catch {
          res.statusCode = 502
          res.end('Proxy error')
        }
      }

      server.middlewares.use('/rss-fetch', (req, res) => proxy(req, res, 'xml'))
      server.middlewares.use('/article-proxy', (req, res) => proxy(req, res, 'html'))
    },
  }
}

export default defineConfig({
  plugins: [
    proxyPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com/,
            handler: 'StaleWhileRevalidate',
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  base: '/startpage/',
  server: {
    proxy: {
      '/iiif-proxy': {
        target: 'https://www.artic.edu',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/iiif-proxy/, '/iiif'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            delete proxyRes.headers['cross-origin-resource-policy']
            delete proxyRes.headers['cross-origin-embedder-policy']
            proxyRes.headers['access-control-allow-origin'] = '*'
          })
        },
      },
    },
  },
  optimizeDeps: {
    include: ['prismjs'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['oldcode', 'node_modules', '.opencode', '.agents'],
  },
})
