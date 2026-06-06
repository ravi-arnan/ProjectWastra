import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import PageLoader from './components/PageLoader'
import ErrorBoundary from './components/ErrorBoundary'

// Shown if a lazy route chunk fails to load (e.g. a stale chunk after a deploy).
const RouteLoadError = (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface text-on-surface px-6 text-center">
    <p className="font-headline font-bold text-lg">Gagal memuat halaman</p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="bg-primary text-on-primary px-5 py-2.5 rounded-lg font-headline font-bold text-sm"
    >
      Muat ulang
    </button>
  </div>
)

// All route components are lazy so the entry chunk holds only the router shell
// and auth context. AppLayout is lazy too — it owns NotificationProvider, which
// pulls in the destinations dataset that the public landing page never needs.
const AppLayout = lazy(() => import('./components/AppLayout'))
const Auth = lazy(() => import('./pages/Auth'))
const Legal = lazy(() => import('./pages/Legal'))
const Landing = lazy(() => import('./pages/Landing'))

const Home = lazy(() => import('./pages/Home'))
const Peta = lazy(() => import('./pages/Peta'))
const DestinationDetail = lazy(() => import('./pages/DestinationDetail'))
const Destinasi = lazy(() => import('./pages/Destinasi'))
const Bandingkan = lazy(() => import('./pages/Bandingkan'))
const Prediksi = lazy(() => import('./pages/Prediksi'))
const Profil = lazy(() => import('./pages/Profil'))
const Watchlist = lazy(() => import('./pages/Watchlist'))
const AiAnalysis = lazy(() => import('./pages/AiAnalysis'))
const Admin = lazy(() => import('./pages/Admin'))
const Otoritas = lazy(() => import('./pages/Otoritas'))
const AiAgent = lazy(() => import('./pages/AiAgent'))
const UserManagement = lazy(() => import('./pages/UserManagement'))
const AuditLogs = lazy(() => import('./pages/AuditLogs'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary fallback={RouteLoadError}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<Legal page="privacy" />} />
            <Route path="/terms" element={<Legal page="terms" />} />
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Home />} />
              <Route path="peta" element={<Peta />} />
              <Route path="destinasi" element={<Destinasi />} />
              <Route path="destinasi/:id" element={<DestinationDetail />} />
              <Route path="bandingkan" element={<Bandingkan />} />
              <Route path="prediksi" element={<Prediksi />} />
              <Route path="ai-analysis" element={<AiAnalysis />} />
              <Route path="profil" element={<Profil />} />
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="otoritas" element={<AdminRoute><Otoritas /></AdminRoute>} />
              <Route path="ai-agent" element={<AdminRoute><AiAgent /></AdminRoute>} />
              <Route path="user-management" element={<AdminRoute><UserManagement /></AdminRoute>} />
              <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  )
}
