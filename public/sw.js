const cachePrefix = 'redcard-studio-';
const cacheName = cachePrefix + 'v3-' + self.registration.scope;
const appUrl = new URL(self.registration.scope);
const indexUrl = new URL('index.html', appUrl);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const response = await fetch(indexUrl, { cache: 'reload' });
    if (!response.ok) throw new Error('???? RedCard Studio ??');
    const html = await response.clone().text();
    const assets = Array.from(html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g), match => new URL(match[1], appUrl));
    const cache = await caches.open(cacheName);
    await cache.addAll(assets);
    await cache.put(indexUrl, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name === 'redcard-studio-v2.0' || (name !== cacheName && name.startsWith(cachePrefix) && name.endsWith('-' + appUrl.href)))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || !url.href.startsWith(appUrl.href)) return;

  const isShell = url.pathname === appUrl.pathname || url.pathname === indexUrl.pathname;
  const isAsset = url.pathname.startsWith(new URL('assets/', appUrl).pathname);
  if (!isShell && !isAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    if (isAsset) {
      const hit = await cache.match(request);
      if (hit) return hit;
    }

    try {
      const response = await fetch(request, isShell ? { cache: 'no-cache' } : undefined);
      if (response.ok) await cache.put(isShell ? indexUrl : request, response.clone());
      return response;
    } catch {
      return (await cache.match(isShell ? indexUrl : request)) || Response.error();
    }
  })());
});
