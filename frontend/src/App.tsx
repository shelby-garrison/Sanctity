import { Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Comments from './pages/Comments'
import { api } from './api'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth()
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppContent() {
  const { token, isLoading } = useAuth()
  
  // Verify token on app load
  const { isLoading: isVerifying } = useQuery(['verify-token'], () => api.get('/auth/verify'), {
    enabled: !!token && !isLoading,
    retry: 1,
    retryDelay: 1000,
    onSuccess: (data) => {
      console.log('Token verification successful:', data)
    },
    onError: (error: any) => {
      console.error('Token verification failed:', error.response?.data || error.message)
      // Only redirect if it's a 401 error (unauthorized)
      if (error.response?.status === 401) {
        console.log('Token is invalid, redirecting to login')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    },
  })

  // Show loading while initializing auth or verifying token
  if (isLoading || (token && isVerifying)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Comments />
            </PrivateRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 