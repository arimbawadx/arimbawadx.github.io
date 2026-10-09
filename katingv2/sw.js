const CACHE_NAME = 'erp-pos-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  // Bypass cache untuk API Calls ke Google Apps Script
  if (event.request.url.includes('script.google.com')) return;
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
