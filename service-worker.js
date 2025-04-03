const CACHE_NAME = "dual-timer-cache-v1";
const assets = [
  "/DualTimer/",
  "/DualTimer/index.html",
  "/DualTimer/manifest.json",
  "/DualTimer/icon.png"
  "/DualTimer/service-worker.js"
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
