import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: false, filename: 'stats.html' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        '**/*.{js,css,html,png,jpg,svg,woff2}',
        '/assets/models/mobilefacenet/**/*.{json,bin}',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,jpg,svg}'],
        globIgnores: [
          '**/models/gemma-2-2b-it-q4f16_1-MLC/**',
          '**/assets/index*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://tfhub.dev' ||
              url.pathname.includes('mobilefacenet') ||
              url.pathname.includes('blazeface') ||
              url.pathname.match(/\/.*\.bin$/),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tfjs-models',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.includes('gemma-2-2b-it-q4f16_1-MLC') &&
              (url.pathname.endsWith('.bin') || url.pathname.endsWith('.json')),
            handler: 'CacheFirst',
            options: {
              cacheName: 'gemma-models',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        navigateFallback: '/index.html',
        additionalManifestEntries: [
          {
            url: '/assets/models/mobilefacenet/model.json',
            revision: '1',
          },
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MiB
      },
      manifest: {
        name: 'SpeedHeart',
        short_name: 'SpeedHeart',
        theme_color: '#ff69b4',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'tensorflow': [
            '@tensorflow/tfjs',
            '@tensorflow-models/toxicity',
            '@tensorflow-models/universal-sentence-encoder',
          ],
          'web-llm': ['@mlc-ai/web-llm'],
          'ui-components': [
            'lucide-react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
          ],
          'animations': ['framer-motion', 'react-confetti'],
          'charts': ['recharts'],
        },
      },
      onwarn(warning, warn) {
        if (warning.code === 'FILE_NOT_FOUND' && warning.message.includes('mobilefacenet')) {
          console.warn('Warning: MobileFaceNet model files missing. Ensure /public/assets/models/mobilefacenet/ contains model.json and .bin shards.');
        }
        warn(warning);
      },
    },
  },
});