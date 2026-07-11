const CACHE = 'hagom-local-quest-v10-item-fit';
const ASSETS = [
  './', './index.html', './styles.css', './app.js', './data.js',
  './manifest.webmanifest', './assets/hagom-front-balanced.png',
  './assets/hagom-placeholder.svg', './assets/favicon.svg', './assets/app-icon.svg',
  './assets/items/yu-cap.svg',
  './assets/items/yu-jacket.svg',
  './assets/items/yu-notebook.svg',
  './assets/items/lake-lotus.svg',
  './assets/items/lake-duck.svg',
  './assets/items/lake-ribbon.svg',
  './assets/items/market-basket.svg',
  './assets/items/market-jujube.svg',
  './assets/items/market-apron.svg',
  './assets/items/history-book.svg',
  './assets/items/history-brush.svg',
  './assets/items/history-hat.svg',
  './assets/items/bangok-camera.svg',
  './assets/items/bangok-leaf.svg',
  './assets/items/bangok-picnic.svg',
  './assets/items/gatbawi-wish.svg',
  './assets/items/gatbawi-hiking.svg',
  './assets/items/gatbawi-lantern.svg',
  './assets/items/red-scarf.svg',
  './assets/items/green-cap.svg',
  './assets/items/heart-balloon.svg',
  './assets/items/clover-badge.svg',
  './assets/items/gold-crown.svg',
  './assets/items/travel-bag.svg',
  './assets/items/hidden-moon.svg',
  './assets/items/hidden-star.svg',
  './assets/items/hidden-aurora.svg',
  './assets/items/hidden-crown.svg',
  './assets/items/friendship-badge.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (!response || response.status !== 200 || response.type === 'opaque') return response;
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
