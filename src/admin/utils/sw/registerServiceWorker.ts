export function registerServiceWorker(onUpdate: () => void): void {
  if (import.meta.env.DEV) {
    return
  }

  if (!('serviceWorker' in navigator)) {
    return
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing
        if (!installing) {
          return
        }

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdate()
          }
        })
      })

      if (registration.waiting) {
        onUpdate()
      }
    }).catch((error) => {
      console.warn('Service worker registration failed', error)
    })
  })
}

export function applyServiceWorkerUpdate(): void {
  if (!('serviceWorker' in navigator)) {
    return
  }

  void navigator.serviceWorker.getRegistration().then((registration) => {
    registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
  })
}
