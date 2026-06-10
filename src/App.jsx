import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './Pages/Public/Home'

const Login = lazy(() => import('./Pages/Auth/Login'))
const Dashboard = lazy(() => import('./Pages/Admin/Dashboard'))
const Teams = lazy(() => import('./Pages/Admin/Teams'))
const Referees = lazy(() => import('./Pages/Admin/Referees'))
const Championships = lazy(() => import('./Pages/Admin/Championships'))
const Matches = lazy(() => import('./Pages/Admin/Matches'))
const MatchLive = lazy(() => import('./Pages/Admin/MatchLive'))
const ImportActa = lazy(() => import('./Pages/Admin/ImportActa'))
const Multimedia = lazy(() => import('./Pages/Admin/Multimedia'))

// Simple Auth guard component
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('auth_token')
  const userString = localStorage.getItem('user')
  
  if (!token || !userString) {
    return <Navigate to="/login" replace />
  }
  
  let user = null
  try {
    user = JSON.parse(userString)
  } catch (e) {
    console.error("Invalid user JSON in ProtectedRoute", e)
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    return <Navigate to="/login" replace />
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to="/admin" replace />
  }
  
  return children
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#070707] flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Admin/Directiva Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'directiva']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/equipos" element={
            <ProtectedRoute allowedRoles={['admin', 'directiva']}>
              <Teams />
            </ProtectedRoute>
          } />
          <Route path="/admin/partidos" element={
            <ProtectedRoute allowedRoles={['admin', 'directiva']}>
              <Matches />
            </ProtectedRoute>
          } />
          <Route path="/admin/partidos/importar-acta" element={
            <ProtectedRoute allowedRoles={['admin', 'directiva']}>
              <ImportActa />
            </ProtectedRoute>
          } />
          <Route path="/admin/partidos/:id/live" element={
            <ProtectedRoute allowedRoles={['admin', 'directiva']}>
              <MatchLive />
            </ProtectedRoute>
          } />
          <Route path="/admin/multimedia" element={
            <ProtectedRoute allowedRoles={['admin', 'directiva']}>
              <Multimedia />
            </ProtectedRoute>
          } />

          {/* Protected Admin Only Routes */}
          <Route path="/admin/arbitros" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Referees />
            </ProtectedRoute>
          } />
          <Route path="/admin/campeonatos" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Championships />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
