import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: object) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  institutions: () => api.get('/auth/institutions'),
}

export const testsApi = {
  list: () => api.get('/tests'),
  get: (id: string) => api.get(`/tests/${id}`),
  submit: (testId: string, answers: number[]) =>
    api.post('/tests/submit', { test_id: testId, answers }),
  mySessions: () => api.get('/tests/sessions/my'),
}

export const coursesApi = {
  list: (theme?: string) => api.get('/courses', { params: theme ? { theme } : {} }),
  get: (id: string) => api.get(`/courses/${id}`),
  start: (id: string) => api.post(`/courses/${id}/start`),
  updateProgress: (id: string, moduleIndex: number) =>
    api.patch(`/courses/${id}/progress`, null, { params: { module_index: moduleIndex } }),
  myProgress: () => api.get('/courses/progress/my'),
}

export const aiApi = {
  chat: (message: string, sessionId?: string, language?: string) =>
    api.post('/ai/chat', { message, session_id: sessionId, language }),
  sessions: () => api.get('/ai/chat/sessions'),
  messages: (sessionId: string) => api.get(`/ai/chat/sessions/${sessionId}/messages`),
}

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  groups: () => api.get('/analytics/groups'),
  criticalUsers: () => api.get('/analytics/critical-users'),
  notifications: () => api.get('/analytics/notifications/my'),
  markRead: (id: string) => api.patch(`/analytics/notifications/${id}/read`),
}

export const usersApi = {
  list: () => api.get('/users'),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, null, { params: { role } }),
  updateLanguage: (language: string) =>
    api.patch('/users/me/language', null, { params: { language } }),
}
