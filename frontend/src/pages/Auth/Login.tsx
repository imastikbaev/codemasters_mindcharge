import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '../../api'
import { useAuthStore } from '../../store/authStore'

const LOGO = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <rect width="36" height="36" rx="10" fill="#6366f1"/>
    <path d="M9 18a9 9 0 0018 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="13" cy="14" r="2" fill="white"/>
    <circle cx="23" cy="14" r="2" fill="white"/>
  </svg>
)

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <LOGO />
            <span className="text-xl font-bold text-gray-900 tracking-tight">MindCharge</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">{t('auth.loginTitle')}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.loggingIn')}
                </span>
              ) : t('auth.login')}
            </button>

            <p className="text-center text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('auth.register')}
              </Link>
            </p>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">Demo-аккаунты (пароль: demo1234)</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { email: 'user@demo.kz', label: 'Пользователь' },
                { email: 'psych@demo.kz', label: 'Психолог' },
                { email: 'director@demo.kz', label: 'Директор' },
                { email: 'admin@demo.kz', label: 'Админ' },
              ].map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword('demo1234') }}
                  className="text-xs py-2 px-3 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-colors text-left"
                >
                  <span className="font-medium">{d.label}</span>
                  <br />
                  <span className="text-gray-400">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
