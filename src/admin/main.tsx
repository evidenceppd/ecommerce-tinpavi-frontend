import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { registerServiceWorker } from './utils/sw/registerServiceWorker'

registerServiceWorker(() => {
  window.dispatchEvent(new Event('sw:update-available'))
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)