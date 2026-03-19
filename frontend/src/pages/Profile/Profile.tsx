import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Users, Globe, BarChart2, ClipboardList } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { testsApi, coursesApi } from '../../api'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'
import LevelBadge from '../../components/ui/LevelBadge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const ROLE_META: Record<string, { label: string; color: string }> = {
  user:         { label: 'Пользователь', color: 'bg-blue-50 text-blue-700' },
  psychologist: { label: 'Психолог',     color: 'bg-violet-50 text-violet-700' },
  director:     { label: 'Директор',     color: 'bg-amber-50 text-amber-700' },
  admin:        { label: 'Администратор', color: 'bg-red-50 text-red-600' },
}

export default function Profile() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const lang = user?.preferred_language || 'ru'

  useEffect(() => {
    Promise.all([testsApi.mySessions(), coursesApi.myProgress()])
      .then(([s, p]) => { setSessions(s.data); setProgress(p.data) })
      .catch(() => {})
  }, [])

  const initials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const roleInfo = ROLE_META[user?.role || 'user'] || ROLE_META.user
  const completedCourses = progress.filter((p: any) => p.completed_at).length
  const chartData = sessions.slice(0, 8).reverse().map((s: any, i: number) => ({
    name: `#${i + 1}`, score: Math.round(s.normalized_score || 0),
  }))

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>

      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 text-2xl font-bold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`badge ${roleInfo.color} text-xs`}>{roleInfo.label}</span>
              {user?.group_name && (
                <span className="badge bg-gray-100 text-gray-600 text-xs">{user.group_name}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ClipboardList, value: sessions.length, label: 'Тестов пройдено', color: 'bg-blue-50 text-blue-600' },
            { icon: BarChart2, value: completedCourses, label: 'Курсов завершено', color: 'bg-green-50 text-green-600' },
            { icon: Shield, value: sessions[0] ? `${Math.round(sessions[0].normalized_score)}%` : '—', label: 'Последний балл', color: 'bg-primary-50 text-primary-600' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Динамика состояния</h3>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData} margin={{ left: -24, right: 4, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'Балл']} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Последние тесты</h3>
            <span className="text-xs text-gray-400">{sessions.length} записей</span>
          </div>
          <div className="divide-y divide-gray-50">
            {sessions.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3">
                <LevelBadge level={s.ai_level} lang={lang} size="sm" />
                <span className="text-sm text-gray-500 flex-1">
                  {new Date(s.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="font-bold text-gray-900">{Math.round(s.normalized_score)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">{t('common.language')}</h3>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  )
}
