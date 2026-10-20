const CACHE_NAME = 'tayfun-cam-balkon-v1';
const urlsToCache = [
	'/',
	'/manifest.json',
	'/index.html'
];

// Install service worker and cache assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache).catch(() => {
				// Ignore cache errors for static assets
			});
		})
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

// Network first strategy with cache fallback
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	event.respondWith(
		fetch(event.request)
			.then((response) => {
				// Cache successful responses
				if (response.ok) {
					const cache = caches.open(CACHE_NAME);
					cache.then((c) => c.put(event.request, response.clone()));
				}
				return response;
			})
			.catch(() => {
				// Fallback to cache for offline
				return caches.match(event.request).then((response) => {
					return response || new Response('Offline - Not cached', { status: 503 });
				});
			})
	);
});
