// Longbook v0.3.0 오프라인 우선: 태블릿에 저장된 파일을 먼저 열고, 인터넷이 되면 뒤에서 조용히 최신 파일로 갱신함
const CACHE = 'longbook-v0-3-0';
const ASSETS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(a => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      const refresh = fetch(e.request.url, { cache: 'no-cache' }).then(r => {
        if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      }).catch(() => null);
      if (cached) { e.waitUntil(refresh); return cached; }
      return refresh.then(r => r || caches.match('index.html'));
    })
  );
});
