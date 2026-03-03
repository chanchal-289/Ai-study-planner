import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AIPlan from './pages/AIPlan'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import AddTopic from './pages/AddTopic'

function ProtectedRoute({ children }) {
  const { token } = useAuth()
  return token ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/ai-plan" element={
        <ProtectedRoute><AIPlan /></ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/add-topic" element={
        <ProtectedRoute><AddTopic /></ProtectedRoute>
      } />
    </Routes>
  )
}