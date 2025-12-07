const CACHE_NAME = "second-brain-v1";
const STATIC_ASSETS = [
	"/",
	"/index.html",
	"/manifest.json",
	"/icon-192x192.png",
	"/icon-512x512.png",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("[Service Worker] Caching static assets");
			return cache.addAll(STATIC_ASSETS);
		})
	);
	self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						console.log("[Service Worker] Removing old cache:", cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
	self.clients.claim();
});

// Fetch event - handle offline requests
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// API Requests (Network First, fallback to Cache)
	if (url.pathname.startsWith("/api/")) {
		// specific handling for trip planner API to enable offline viewing
		if (url.pathname.includes("/trip-planner/")) {
			event.respondWith(
				fetch(event.request)
					.then((response) => {
						// Clone response to cache it
						if (event.request.method === "GET" && response.ok) {
							const responseClone = response.clone();
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(event.request, responseClone);
							});
						}
						return response;
					})
					.catch(() => {
						// If offline, try to return from cache
						return caches.match(event.request).then((response) => {
							if (response) {
								return response;
							}
							// Return a standardized offline JSON response if not found
							return new Response(
								JSON.stringify({ error: "No internet connection. Data not cached." }),
								{ 
									status: 503, 
									headers: { "Content-Type": "application/json" } 
								}
							);
						});
					})
			);
			return;
		}
	}

	// Static Assets (Stale-While-Revalidate for text/html/css/js, Cache First for images)
	if (event.request.destination === "image") {
		event.respondWith(
			caches.match(event.request).then((response) => {
				return response || fetch(event.request).then((response) => {
					if (response.ok) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				});
			})
		);
		return;
	}

	// Default: Network First for HTML, falling back to cached index.html (SPA)
	if (event.request.mode === "navigate") {
		event.respondWith(
			fetch(event.request).catch(() => {
				return caches.match(event.request).then((response) => {
					return response || caches.match("/index.html");
				});
			})
		);
		return;
	}

	// Default fallback
	event.respondWith(
		caches.match(event.request).then((response) => {
			return response || fetch(event.request);
		})
	);
});
