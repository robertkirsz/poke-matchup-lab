const VERSION = "poke-matchup-v2";
const APP_CACHE = `${VERSION}-app`;
const POKEAPI_CACHE = `${VERSION}-pokeapi`;
const APP_SHELL = ["/", "/manifest.webmanifest", "/favicon.svg", "/pwa-192.png", "/pwa-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== APP_CACHE && key !== POKEAPI_CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  const isPokeApiRequest = url.origin === "https://pokeapi.co";
  const isPokeApiSprite =
    url.origin === "https://raw.githubusercontent.com" && url.pathname.startsWith("/PokeAPI/sprites/");

  if (isPokeApiRequest || isPokeApiSprite) {
    event.respondWith(
      caches.open(POKEAPI_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached ?? fresh;
      }),
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(APP_CACHE).then((cache) => cache.put("/", response.clone()));
          return response;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      if (response.ok) caches.open(APP_CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    })),
  );
});
