import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// Cache TFJS models
registerRoute(
  ({ url }) => url.origin === 'https://tfhub.dev' || url.origin.includes('tensorflow'),
  new CacheFirst({
    cacheName: 'tfjs-models',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service worker activated');
  self.clients.claim();
});