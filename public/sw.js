const CACHE_VERSION = "rider-pwa-v1"
const STATIC_CACHE = `${CACHE_VERSION}-static`
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`
const OFFLINE_FALLBACK_URL = "/rider/offline"

const PRECACHE_URLS = [
  OFFLINE_FALLBACK_URL,
  "/manifest.webmanifest",
  "/logo.png",
  "/logo-icon.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("rider-pwa-") && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  const cache = await caches.open(STATIC_CACHE)
  cache.put(request, response.clone())
  return response
}

async function networkFirst(request, fallbackUrl = OFFLINE_FALLBACK_URL) {
  try {
    const response = await fetch(request)
    const cache = await caches.open(RUNTIME_CACHE)
    cache.put(request, response.clone())
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    const fallback = await caches.match(fallbackUrl)
    if (fallback) return fallback
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate" && url.pathname.startsWith("/rider")) {
    event.respondWith(networkFirst(request))
    return
  }

  if (request.destination === "script" || request.destination === "style" || request.destination === "image" || request.destination === "font") {
    event.respondWith(cacheFirst(request))
  }
})
