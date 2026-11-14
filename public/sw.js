const CACHE_NAME = 'berzowanley-library-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/')),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('berzowanley-library-shell-') && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response.ok) {
          try {
            await caches.open(CACHE_NAME).then((cache) => cache.put('/', response.clone()));
          } catch (error) {
            console.error('Could not cache the library app shell.', error);
          }
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match('/');
        if (cached) return cached;
        throw new Error('The library app shell is not available offline yet.');
      }),
    );
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then(async (response) => {
          if (response.ok) {
            try {
              await caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
            } catch (error) {
              console.error('Could not cache a library asset.', error);
            }
          }
          return response;
        });
      }),
    );
  }
});
