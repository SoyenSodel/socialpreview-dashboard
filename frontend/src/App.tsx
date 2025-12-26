import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import LoginScreen from './components/LoginScreen'
import { TeamDashboard } from './components/dashboard/TeamDashboard'
import { UserDashboard } from './components/dashboard/UserDashboard'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { configureDOMPurify } from './utils/sanitize'

/**
 * Handles role-based routing for the dashboard.
 * Redirects users to their specific dashboard based on their role.
 */
function DashboardRouter() {
  const { user } = useAuth()

  if (user?.role === 'management' || user?.role === 'team') {
    return <TeamDashboard />
  }

  if (user?.role === 'user') {
    return <UserDashboard />
  }

  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRouter />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function App() {
  useEffect(() => {
    configureDOMPurify()

    const loader = document.getElementById('app-loader')
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden')
        document.body.classList.add('loaded')

        setTimeout(() => {
          loader.remove()
        }, 300)
      }, 100)
    }
  }, [])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <AppRoutes />
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
