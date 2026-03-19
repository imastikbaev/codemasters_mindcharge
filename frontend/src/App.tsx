import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing/Landing'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Tests from './pages/Tests/Tests'
import TestTaking from './pages/Tests/TestTaking'
import Courses from './pages/Courses/Courses'
import CourseView from './pages/Courses/CourseView'
import Results from './pages/Results/Results'
import Assistant from './pages/Assistant/Assistant'
import PsychologistPanel from './pages/Psychologist/PsychologistPanel'
import AdminPanel from './pages/Admin/AdminPanel'
import Profile from './pages/Profile/Profile'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

function RoleRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/tests" element={<PrivateRoute><Tests /></PrivateRoute>} />
          <Route path="/tests/:testId" element={<PrivateRoute><TestTaking /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute><Courses /></PrivateRoute>} />
          <Route path="/courses/:courseId" element={<PrivateRoute><CourseView /></PrivateRoute>} />
          <Route path="/results" element={<PrivateRoute><Results /></PrivateRoute>} />
          <Route path="/assistant" element={<PrivateRoute><Assistant /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/psychologist" element={
            <RoleRoute roles={['psychologist', 'director', 'admin']}>
              <PsychologistPanel />
            </RoleRoute>
          } />
          <Route path="/admin" element={
            <RoleRoute roles={['director', 'admin']}>
              <AdminPanel />
            </RoleRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
