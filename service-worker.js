const CACHE_NAME = "dual-timer-cache-v1";
const assets = [
  "DualTimer.html",
  "manifest.json",
  "icon180.png",
  "service-worker.js",
  "alarm.mp3",  
  "beep2.mp3"  
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
