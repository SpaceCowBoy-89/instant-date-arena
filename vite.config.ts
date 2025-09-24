import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { componentTagger } from "lovable-tagger";
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    hmr: {
      port: 8080,
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    svgr({
      svgrOptions: {
        exportType: 'default',
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        '**/*.{js,css,html,png,jpg,svg,woff2}',
        '/assets/models/MiniLM-L6-v2/mlp_classifier.tflite',
        '/assets/models/MiniLM-L6-v2/minilm_onnx/**/*.{onnx,json}',
        '/assets/captain-corazon-avatar.svg',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,jpg,svg,tflite,onnx}'],
        globIgnores: [
          '**/models/gemma-2-2b-it-q4f16_1-MLC/**',
          '**/assets/index*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://tfhub.dev' ||
              url.pathname.includes('MiniLM-L6-v2') ||
              url.pathname.match(/\/.*\.(bin|tflite|onnx)$/),
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
            url: '/assets/models/MiniLM-L6-v2/mlp_classifier.tflite',
            revision: '1',
          },
          {
            url: '/assets/models/MiniLM-L6-v2/minilm_onnx/model.onnx',
            revision: '1',
          },
          {
            url: '/assets/captain-corazon-avatar.svg',
            revision: '2',
          },
        ],
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100 MiB
      },
      manifest: {
        name: 'SpeedHeart',
        short_name: 'SpeedHeart',
        description: 'Instant Date Arena',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Redirect ML dependencies to dev stubs in development
      ...(process.env.NODE_ENV === 'development' ? {
        '@/services/moderation': fileURLToPath(new URL('./src/services/moderation.dev.ts', import.meta.url)),
        '@/utils/tfjsUtils': fileURLToPath(new URL('./src/utils/tfjsUtils.dev.ts', import.meta.url)),
      } : {}),
    },
  },
  build: {
    rollupOptions: {
      external: ['react-native'],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          // ML dependencies now lazy-loaded - exclude from main chunks to prevent blocking startup
          // 'tensorflow': [...],  // Removed to prevent eager loading
          // 'ml-models': [...],   // Removed to prevent eager loading
          'web-llm': ['@mlc-ai/web-llm'], // Keep separate as it's needed for specific features
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
        // Suppress module externalization warnings
        if (warning.code === 'PLUGIN_WARNING' && warning.plugin === 'vite:resolve') {
          return;
        }
        if (warning.code === 'FILE_NOT_FOUND' && warning.message.includes('MiniLM-L6-v2')) {
          console.warn('Warning: MiniLM-L6-v2 model files missing. Ensure /public/assets/models/MiniLM-L6-v2/ contains mlp_classifier.tflite and minilm_onnx/.');
          return;
        }
        warn(warning);
      },
    },
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000, // Increase limit since ML deps are now lazy-loaded
  },
  optimizeDeps: {
    exclude: [
      // Exclude heavy ML dependencies from pre-bundling to speed up dev server
      '@tensorflow/tfjs',
      '@tensorflow-models/universal-sentence-encoder',
      '@tensorflow-models/toxicity',
      '@tensorflow-models/blazeface',
      '@xenova/transformers',
      'onnxruntime-web',
      '@mlc-ai/web-llm'
    ],
    // Force include commonly used deps to avoid discovery during development
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ]
  },
  logLevel: 'warn',
}));