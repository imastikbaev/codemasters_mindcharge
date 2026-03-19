import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardList, BookOpen, ArrowRight, MessageSquare, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { testsApi, coursesApi } from '../../api'
import LevelBadge from '../../components/ui/LevelBadge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const LEVEL_COLORS: Record<string, string> = {
  norm: 'bg-emerald-50 border-emerald-100 text-emerald-700',
  elevated: 'bg-amber-50 border-amber-100 text-amber-700',
  burnout_risk: 'bg-orange-50 border-orange-100 text-orange-700',
  critical: 'bg-red-50 border-red-100 text-red-700',
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const lang = user?.preferred_language || 'ru'

  useEffect(() => {
    Promise.all([testsApi.mySessions(), coursesApi.myProgress()])
      .then(([s, p]) => { setSessions(s.data); setProgress(p.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const lastSession = sessions[0]
  const activeCourses = progress.filter((p: any) => !p.completed_at)
  const chartData = sessions.slice(0, 8).reverse().map((s: any, i: number) => ({
    name: `#${i + 1}`,
    score: Math.round(s.normalized_score || 0),
  }))

  const levelBg = lastSession ? (LEVEL_COLORS[lastSession.ai_level] || LEVEL_COLORS.norm) : ''

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.greeting')}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString(
              lang === 'en' ? 'en-US' : lang === 'kz' ? 'kk-KZ' : 'ru-RU',
              { weekday: 'long', day: 'numeric', month: 'long' }
            )}
          </p>
        </div>
        <button onClick={() => navigate('/assistant')} className="btn-secondary">
          <MessageSquare className="w-4 h-4" />
          EMi
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className={`card p-6 border ${lastSession ? levelBg : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.stateCard')}</span>
            {lastSession && <AlertCircle className="w-4 h-4 text-gray-400" />}
          </div>
          {lastSession ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{Math.round(lastSession.normalized_score || 0)}</span>
                <span className="text-lg text-gray-400">/ 100</span>
              </div>
              <LevelBadge level={lastSession.ai_level} lang={lang} size="sm" />
              <p className="text-sm text-gray-600 line-clamp-2">{lastSession.ai_summary}</p>
              <button
                onClick={() => navigate('/results')}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {t('results.details')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">{t('dashboard.noTests')}</p>
              <button onClick={() => navigate('/tests')} className="btn-primary w-full">
                <ClipboardList className="w-4 h-4" />
                {t('dashboard.takeTest')}
              </button>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('dashboard.myCourses')}</span>
            <span className="badge bg-gray-100 text-gray-600">{activeCourses.length}</span>
          </div>
          {activeCourses.length > 0 ? (
            <div className="space-y-4">
              {activeCourses.slice(0, 2).map((p: any) => {
                const pct = Math.min(((p.completed_modules?.length || 0) / 4) * 100, 100)
                return (
                  <div key={p.course_id}>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                      <span className="font-medium text-gray-700 truncate">Курс</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
              <button onClick={() => navigate('/courses')} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                {t('courses.continue')} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">{t('dashboard.noCourses')}</p>
              <button onClick={() => navigate('/courses')} className="btn-secondary w-full">
                <BookOpen className="w-4 h-4" />
                {t('dashboard.browseCourses')}
              </button>
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Быстрые действия</span>
          </div>
          <div className="space-y-2">
            {[
              { icon: ClipboardList, label: t('dashboard.takeTest'), color: 'bg-blue-50 text-blue-600', to: '/tests' },
              { icon: BookOpen, label: t('dashboard.browseCourses'), color: 'bg-green-50 text-green-600', to: '/courses' },
              { icon: TrendingUp, label: t('nav.results'), color: 'bg-primary-50 text-primary-600', to: '/results' },
              { icon: MessageSquare, label: 'Спросить EMi', color: 'bg-violet-50 text-violet-600', to: '/assistant' },
            ].map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 ml-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {chartData.length > 1 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('dashboard.stateHistory')}</h3>
            <span className="ml-auto text-xs text-gray-400">{chartData.length} записей</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: any) => [`${v}%`, t('results.score')]}
              />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {sessions.length > 0 && sessions[0].ai_recommendations_json?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Рекомендации AI</h3>
          <div className="space-y-2.5">
            {sessions[0].ai_recommendations_json.slice(0, 4).map((rec: string, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
