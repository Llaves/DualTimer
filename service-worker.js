const CACHE_NAME = "dual-timer-cache-v3";
const assets = [
  "DualTimer.html",
  "manifest.json",
  "icon180.png",
  "service-worker.js",
  "alarm.mp3",  
  "beep2.mp3" ,
  "timer.css",
  "timer.js",
  "countdown.mp3 ",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  const cachePrefix = 'dual-timer-cache-v';
  console.log('Activating new service worker:', CACHE_NAME);

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Cache name:', cacheName);
          if (cacheName.startsWith(cachePrefix) && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache starting with:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
