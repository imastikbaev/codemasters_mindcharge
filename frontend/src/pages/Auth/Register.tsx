import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [form, setForm] = useState({
    email: '', password: '', name: '',
    age_group: 'adult', role: 'user',
    group_name: '', preferred_language: 'ru',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.register(form)
      setAuth(res.data.user, res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3">
            <LOGO />
            <span className="text-xl font-bold text-gray-900 tracking-tight">MindCharge</span>
          </Link>
          <p className="text-gray-500 text-sm mt-1">{t('auth.registerTitle')}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('auth.name')}</label>
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)} className="input" placeholder="Иван Петров" required />
            </div>
            <div>
              <label className="label">{t('auth.email')}</label>
              <input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">{t('auth.password')}</label>
              <input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="input" placeholder="Минимум 6 символов" required minLength={6} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('auth.ageGroup')}</label>
                <select value={form.age_group} onChange={e => update('age_group', e.target.value)} className="input">
                  <option value="child">{t('auth.child')}</option>
                  <option value="teen">{t('auth.teen')}</option>
                  <option value="adult">{t('auth.adult')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('auth.role')}</label>
                <select value={form.role} onChange={e => update('role', e.target.value)} className="input">
                  <option value="user">{t('auth.user')}</option>
                  <option value="psychologist">{t('auth.psychologist')}</option>
                  <option value="director">{t('auth.director')}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">{t('auth.group')}</label>
              <input type="text" value={form.group_name} onChange={e => update('group_name', e.target.value)} className="input" placeholder="CS-301 / HR Department" />
            </div>

            <div>
              <label className="label">{t('auth.language') || 'Язык'}</label>
              <select value={form.preferred_language} onChange={e => update('preferred_language', e.target.value)} className="input">
                <option value="ru">Русский</option>
                <option value="en">English</option>
                <option value="kz">Қазақша</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('auth.registering')}
                </span>
              ) : t('auth.register')}
            </button>

            <p className="text-center text-sm text-gray-500">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">{t('auth.login')}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
