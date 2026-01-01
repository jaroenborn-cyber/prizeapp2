const CACHE_NAME = 'coinmarkt-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg'
];

// Install event - cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external API calls (always fetch fresh)
  if (event.request.url.includes('coingecko') || 
      event.request.url.includes('binance') ||
      event.request.url.includes('mempool.space')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone response for cache
        const responseToCache = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request);
      })
  );
});
