import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AdminSectionSkeleton from './components/admin/AdminSectionSkeleton'
import UpdateAvailableBanner from './components/admin/UpdateAvailableBanner'
import { applyServiceWorkerUpdate } from './utils/sw/registerServiceWorker'

const AdminPage = lazy(() => import('./pages/AdminPage'))

export default function App() {
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)

  useEffect(() => {
    const handleUpdateAvailable = () => setIsUpdateAvailable(true)
    window.addEventListener('sw:update-available', handleUpdateAvailable)
    return () => window.removeEventListener('sw:update-available', handleUpdateAvailable)
  }, [])

  const handleApplyUpdate = useCallback(() => {
    const onControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker?.addEventListener('controllerchange', onControllerChange, { once: true })
    applyServiceWorkerUpdate()
  }, [])

  return (
    <>
      {isUpdateAvailable ? (
        <UpdateAvailableBanner
          onRefresh={handleApplyUpdate}
          onDismiss={() => setIsUpdateAvailable(false)}
        />
      ) : undefined}
      <Routes>
        <Route
          path="/admin"
          element={<Suspense fallback={<div className="min-h-screen p-4 sm:p-6"><AdminSectionSkeleton label="Carregando painel administrativo" /></div>}><AdminPage /></Suspense>}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  )
}