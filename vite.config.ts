import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { componentTagger } from "lovable-tagger";
import path from 'path';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  define: {
    global: 'globalThis',
  },
  server: {
    port: 4173,
    hmr: {
      port: 4173,
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
      // Always use dev stubs for faster builds and dev server startup
      '@/services/moderation': fileURLToPath(new URL('./src/services/moderation.dev.ts', import.meta.url)),
      '@/utils/tfjsUtils': fileURLToPath(new URL('./src/utils/tfjsUtils.dev.ts', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      // external: ['react-native'], // Removed - no longer used
      output: {
        manualChunks(id) {
          // Enhanced manual chunking with size-aware strategy

          // Critical vendor chunks - load first (keep small for initial load)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }

          // Supabase - separate from other vendors due to size
          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase-core';
          }
          if (id.includes('node_modules/@supabase/') && !id.includes('supabase-js')) {
            return 'supabase-extras';
          }

          // Animations - lazy load only when needed (biggest impact)
          if (id.includes('node_modules/framer-motion')) {
            return 'animations-framer';
          }
          if (id.includes('node_modules/react-confetti')) {
            return 'animations-confetti';
          }

          // UI Component libraries by usage frequency
          if (id.includes('node_modules/lucide-react')) {
            return 'ui-icons'; // Most used icons
          }

          // Split Radix UI by component groups
          if (id.includes('node_modules/@radix-ui/react-dialog') ||
              id.includes('node_modules/@radix-ui/react-alert-dialog')) {
            return 'ui-dialogs';
          }
          if (id.includes('node_modules/@radix-ui/react-dropdown-menu') ||
              id.includes('node_modules/@radix-ui/react-select') ||
              id.includes('node_modules/@radix-ui/react-accordion')) {
            return 'ui-navigation';
          }
          if (id.includes('node_modules/@radix-ui/react-checkbox') ||
              id.includes('node_modules/@radix-ui/react-radio-group') ||
              id.includes('node_modules/@radix-ui/react-switch') ||
              id.includes('node_modules/@radix-ui/react-slider')) {
            return 'ui-forms';
          }
          if (id.includes('node_modules/@radix-ui/')) {
            return 'ui-radix-others';
          }

          // Heavy utility libraries
          if (id.includes('node_modules/date-fns')) {
            return 'utils-date';
          }
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }

          // Capacitor/native platform specific
          if (id.includes('node_modules/@capacitor/')) {
            return 'capacitor';
          }

          // Query and state management
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query-client';
          }

          // Common utilities (small, can be grouped)
          if (id.includes('node_modules/clsx') ||
              id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'utils-styling';
          }

          // Group arena games into single chunk (our custom grouping)
          if (id.includes('/features/ArenaGames') ||
              id.includes('/pages/Speed') && id.includes('Arena')) {
            return 'arena-games';
          }

          // Chat/messaging features with realtime
          if (id.includes('/pages/GroupChat') ||
              id.includes('/pages/Chat') ||
              id.includes('/pages/MessagesInbox') ||
              id.includes('/providers/RealtimeProvider')) {
            return 'messaging-features';
          }

          // Heavy onboarding flow
          if (id.includes('/pages/Onboarding') ||
              id.includes('react-joyride')) {
            return 'onboarding-flow';
          }

          // All other vendor dependencies (fallback)
          if (id.includes('node_modules/')) {
            return 'vendor-others';
          }
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
      // Exclude ALL heavy dependencies that slow down dev server
      '@tensorflow/tfjs',
      '@tensorflow-models/universal-sentence-encoder',
      '@tensorflow-models/toxicity',
      '@tensorflow-models/blazeface',
      '@xenova/transformers',
      'onnxruntime-web',
      'onnxruntime-node',
      'onnxruntime-common',
      'onnxruntime-react-native',
      '@mlc-ai/web-llm',
      '@mediapipe/face_detection',
      '@mediapipe/face_mesh',
      'llama.rn',
      'framer-motion',
      'motion-dom',
      'recharts',
      'react-native',
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      'date-fns'
    ],
    // Force include commonly used deps to avoid discovery during development
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'clsx',
      'class-variance-authority'
    ],
    // Only disable discovery in development mode
    noDiscovery: process.env.NODE_ENV === 'development' && mode === 'development'
  },
  logLevel: 'warn',
}));