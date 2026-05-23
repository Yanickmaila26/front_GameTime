import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './Pages/Public/Home'
import Login from './Pages/Auth/Login'
import Dashboard from './Pages/Admin/Dashboard'
import Teams from './Pages/Admin/Teams'
import Referees from './Pages/Admin/Referees'
import Championships from './Pages/Admin/Championships'
import Matches from './Pages/Admin/Matches'
import MatchLive from './Pages/Admin/MatchLive'
import Multimedia from './Pages/Admin/Multimedia'

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

function App() {
  return (
    <Router>
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
    </Router>
  )
}

export default App
