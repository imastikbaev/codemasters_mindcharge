import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { testsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import LevelBadge from '../../components/ui/LevelBadge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const LEVEL_META: Record<string, { label: Record<string, string>; bar: string }> = {
  norm:         { label: { ru: 'Норма', en: 'Normal', kz: 'Қалыпты' }, bar: 'bg-emerald-500' },
  elevated:     { label: { ru: 'Повышенный стресс', en: 'Elevated Stress', kz: 'Жоғары стресс' }, bar: 'bg-amber-500' },
  burnout_risk: { label: { ru: 'Риск выгорания', en: 'Burnout Risk', kz: 'Күйіп-жану қаупі' }, bar: 'bg-orange-500' },
  critical:     { label: { ru: 'Критическое', en: 'Critical', kz: 'Сын жағдай' }, bar: 'bg-red-500' },
}

export default function Results() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const lang = user?.preferred_language || 'ru'

  useEffect(() => {
    testsApi.mySessions()
      .then(res => setSessions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chartData = sessions.slice(0, 10).reverse().map((s: any, i: number) => ({
    name: `#${i + 1}`,
    score: Math.round(s.normalized_score || 0),
    level: s.ai_level,
  }))

  const lastScore = sessions[0] ? Math.round(sessions[0].normalized_score) : null
  const prevScore = sessions[1] ? Math.round(sessions[1].normalized_score) : null
  const delta = lastScore !== null && prevScore !== null ? lastScore - prevScore : null

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card p-6 animate-pulse h-20" />)}
    </div>
  )

  if (sessions.length === 0) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">{t('results.title')}</h1>
      <div className="card p-16 text-center">
        <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">{t('results.noResults')}</p>
        <p className="text-sm text-gray-400 mt-1">Пройдите первый тест, чтобы увидеть результаты</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('results.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('results.subtitle')}</p>
      </div>

      {lastScore !== null && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Последний балл</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900">{lastScore}</span>
              <span className="text-gray-400">/ 100</span>
            </div>
            <div className="mt-2">
              <LevelBadge level={sessions[0].ai_level} lang={lang} size="sm" />
            </div>
          </div>
          <div className="card p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Всего тестов</p>
            <div className="text-3xl font-bold text-gray-900">{sessions.length}</div>
            <p className="text-sm text-gray-500 mt-2">пройдено</p>
          </div>
          {delta !== null && (
            <div className="card p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Динамика</p>
              <div className={`flex items-center gap-1.5 ${delta < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {delta < 0 ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                <span className="text-2xl font-bold">{Math.abs(delta)}%</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{delta < 0 ? 'улучшение' : 'ухудшение'}</p>
            </div>
          )}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">{t('dashboard.stateHistory')}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ReferenceLine y={30} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={55} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={75} stroke="#f97316" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip
                contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                formatter={(v: any) => [`${v}%`, t('results.score')]}
              />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 justify-end text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-emerald-500 inline-block" /> Норма</span>
            <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-amber-500 inline-block" /> Повышенный</span>
            <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-orange-500 inline-block" /> Риск</span>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-700">История тестирований</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {sessions.map((s: any) => {
            const score = Math.round(s.normalized_score || 0)
            const meta = LEVEL_META[s.ai_level] || LEVEL_META.norm
            const isExp = expandedId === s.id
            return (
              <div key={s.id}>
                <button
                  onClick={() => setExpandedId(isExp ? null : s.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
                >
                  <div className="w-1 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gray-100">
                    <div className={`w-full rounded-full ${meta.bar}`} style={{ height: `${score}%` }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={s.ai_level} lang={lang} size="sm" />
                      <span className="text-xs text-gray-400">
                        {new Date(s.completed_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {s.ai_summary && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{s.ai_summary}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xl font-bold text-gray-900">{score}<span className="text-sm text-gray-400 font-normal">%</span></span>
                    {isExp ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExp && (
                  <div className="px-6 pb-5 bg-gray-50/30">
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      {s.ai_summary && (
                        <p className="text-sm text-gray-600 leading-relaxed">{s.ai_summary}</p>
                      )}
                      {s.ai_recommendations_json?.length > 0 && (
                        <ul className="space-y-2 mt-3">
                          {s.ai_recommendations_json.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
