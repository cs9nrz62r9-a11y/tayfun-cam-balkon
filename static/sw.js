const CACHE_NAME = 'tayfun-works-assets-v2';
const urlsToCache = [
	'/manifest.json',
	'/logo-192.png',
	'/logo-512.png',
	'/logo-192-maskable.png'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
	);
	self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') {
		return;
	}

	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin) return;

	// Never cache page documents or API data. Installed shortcuts must always
	// receive the newest deployed application shell and account state.
	if (event.request.mode === 'navigate' || url.pathname.startsWith('/api/')) {
		event.respondWith(
			fetch(event.request).catch(() => new Response(
				'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edip yeniden deneyin.',
				{ status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
			))
		);
		return;
	}

	// Build assets are content-hashed, so they are safe to retain offline.
	if (url.pathname.startsWith('/_app/immutable/') || urlsToCache.includes(url.pathname)) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				const network = fetch(event.request).then((response) => {
					if (response.ok) {
						caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
					}
					return response;
				});
				return cached || network;
			})
		);
	}
});
