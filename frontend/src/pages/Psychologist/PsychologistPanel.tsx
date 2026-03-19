import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, TrendingDown, AlertCircle, Activity, Download } from 'lucide-react'
import { analyticsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import LevelBadge from '../../components/ui/LevelBadge'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const PIE_COLORS = ['#10b981', '#f59e0b', '#f97316', '#ef4444']
const LEVEL_LABELS = { ru: ['Норма', 'Повышенный', 'Риск', 'Критическое'], en: ['Normal', 'Elevated', 'Risk', 'Critical'], kz: ['Қалыпты', 'Жоғары', 'Қауіп', 'Сын'] }

export default function PsychologistPanel() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const lang = user?.preferred_language || 'ru'
  const [tab, setTab] = useState<'overview' | 'groups' | 'critical'>('overview')
  const [overview, setOverview] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [critical, setCritical] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([analyticsApi.overview(), analyticsApi.groups(), analyticsApi.criticalUsers()])
      .then(([o, g, c]) => { setOverview(o.data); setGroups(g.data); setCritical(c.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const downloadCSV = () => {
    if (!overview) return
    const rows = [
      ['Группа', 'Норма', 'Повышенный', 'Риск выгорания', 'Критическое', 'Средний балл'],
      ...groups.map((g: any) => [g.group_name, g.norm, g.elevated, g.burnout_risk, g.critical, g.avg_score]),
      [],
      ['Итого пользователей', overview.total_users],
      ['Критических случаев', overview.critical_count],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mindcharge-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="card p-5 h-24 animate-pulse" />)}</div>
    </div>
  )

  const labels = LEVEL_LABELS[lang as keyof typeof LEVEL_LABELS] || LEVEL_LABELS.ru
  const pieData = overview ? [
    { name: labels[0], value: overview.norm_count },
    { name: labels[1], value: overview.elevated_count },
    { name: labels[2], value: overview.burnout_risk_count },
    { name: labels[3], value: overview.critical_count },
  ] : []

  const tabs = [
    { key: 'overview', label: t('psychologist.overview') },
    { key: 'groups', label: t('psychologist.groups') },
    { key: 'critical', label: t('psychologist.critical'), count: critical.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('psychologist.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">Аналитика и мониторинг пользователей</p>
        </div>
        <button onClick={downloadCSV} className="btn-secondary gap-2">
          <Download className="w-4 h-4" />
          {t('psychologist.downloadReport')}
        </button>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('psychologist.totalUsers'), value: overview.total_users, icon: Users, style: 'bg-blue-50 text-blue-600' },
            { label: t('psychologist.normPct'), value: overview.norm_count, icon: Activity, style: 'bg-emerald-50 text-emerald-600' },
            { label: t('psychologist.stressPct'), value: overview.elevated_count + overview.burnout_risk_count, icon: TrendingDown, style: 'bg-amber-50 text-amber-600' },
            { label: t('psychologist.criticalCount'), value: overview.critical_count, icon: AlertCircle, style: 'bg-red-50 text-red-600' },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${s.style}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map(t_ => (
          <button
            key={t_.key}
            onClick={() => setTab(t_.key as any)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t_.key
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t_.label}
            {t_.count ? (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">{t_.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">Распределение по уровням</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2">
              {labels.map((l, i) => (
                <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                  {l}
                </span>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-5">По группам</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={groups.slice(0, 6)} margin={{ left: -24, right: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="group_name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }} />
                <Bar dataKey="norm" stackId="a" fill="#10b981" name={labels[0]} />
                <Bar dataKey="elevated" stackId="a" fill="#f59e0b" name={labels[1]} />
                <Bar dataKey="burnout_risk" stackId="a" fill="#f97316" name={labels[2]} />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" radius={[4,4,0,0]} name={labels[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'groups' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-600">{t('psychologist.group')}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-emerald-600">{labels[0]}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-amber-600">{labels[1]}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-orange-600">{labels[2]}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-red-600">{labels[3]}</th>
                  <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Ср. балл</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g: any) => (
                  <tr key={g.group_name} className="table-row">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{g.group_name}</td>
                    <td className="px-4 py-3.5 text-center"><span className="badge bg-emerald-50 text-emerald-700">{g.norm}</span></td>
                    <td className="px-4 py-3.5 text-center"><span className="badge bg-amber-50 text-amber-700">{g.elevated}</span></td>
                    <td className="px-4 py-3.5 text-center"><span className="badge bg-orange-50 text-orange-700">{g.burnout_risk}</span></td>
                    <td className="px-4 py-3.5 text-center"><span className="badge bg-red-50 text-red-700">{g.critical}</span></td>
                    <td className="px-4 py-3.5 text-center font-semibold text-gray-900">{g.avg_score}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'critical' && (
        <>
          {critical.length === 0 ? (
            <div className="card p-16 text-center">
              <Activity className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="font-medium text-gray-700">{t('psychologist.noCritical')}</p>
              <p className="text-sm text-gray-400 mt-1">Все пользователи в норме</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">Требуют внимания: {critical.length} чел.</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">{t('psychologist.userName')}</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600">{t('psychologist.group')}</th>
                      <th className="text-center px-4 py-3.5 font-semibold text-gray-600">Уровень</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600">{t('psychologist.testDate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {critical.map((c: any) => (
                      <tr key={c.session_id} className="table-row">
                        <td className="px-5 py-3.5 font-medium text-gray-800">{c.user_name}</td>
                        <td className="px-4 py-3.5 text-gray-500">{c.group_name || '—'}</td>
                        <td className="px-4 py-3.5 text-center"><LevelBadge level="critical" lang={lang} size="sm" /></td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {c.completed_at ? new Date(c.completed_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
