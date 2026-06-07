import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App'

// One-time storage migration: drop the legacy global mango_bookings key
// (replaced by per-user mango_bookings:<uuid>; see src/lib/storage.ts).
try {
  localStorage.removeItem('mango_bookings')
} catch {
  // ignore — Safari private mode etc.
}

// Native (Capacitor) shell setup. Guarded by isNative so the web build never
// fetches the native chunk; only the APK runtime loads and runs it.
import { isNative } from './lib/platform'
if (isNative) {
  import('./lib/native').then(({ initNative }) => initNative()).catch(() => {})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
