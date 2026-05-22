const CACHE_VERSION = 'tinpavi-v2'
const HTML_STRATEGY = 'network-first'
const ASSET_STRATEGY = 'cache-first'
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`
const ASSET_CACHE = `assets-${CACHE_VERSION}`
const APP_SHELL_FILES = ['/', '/index.html', '/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_FILES)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== APP_SHELL_CACHE && cacheName !== ASSET_CACHE)
        .map((cacheName) => caches.delete(cacheName)),
    )).then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isCacheableAsset(request, url) {
  if (request.method !== 'GET') {
    return false
  }

  if (url.origin !== self.location.origin) {
    return false
  }

  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/uploads')) {
    return false
  }

  return ['style', 'script', 'image', 'font'].includes(request.destination)
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request)
        const cache = await caches.open(APP_SHELL_CACHE)
        cache.put(request, networkResponse.clone())
        return networkResponse
      } catch {
        const cache = await caches.open(APP_SHELL_CACHE)
        return (await cache.match(request)) || (await cache.match('/offline.html'))
      }
    })())
    return
  }

  if (!isCacheableAsset(request, url)) {
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(ASSET_CACHE)
    const cachedResponse = await cache.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  })())
})
