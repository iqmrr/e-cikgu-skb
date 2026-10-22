// Cache fail sistem supaya boleh dibuka tanpa internet (bila dihoskan, cth GitHub Pages)
const CACHE = 'ecikgu-skb-v3';
const FILES = ['./', './index.html', './css/style.css', './js/db.js', './js/app.js', './js/cloud.js', './assets/logo.png', './manifest.json'];
const SDK = 'https://www.gstatic.com/firebasejs/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  // Firebase SDK (versi tetap): cache dahulu supaya sync boleh dimuat walaupun offline
  if (url.startsWith(SDK)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    })));
    return;
  }
  if (!url.startsWith(self.location.origin)) return;
  // Fail sistem: rangkaian dahulu (kemas kini terus sampai), cache jika offline
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
