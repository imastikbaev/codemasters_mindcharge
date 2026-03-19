import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usersApi, analyticsApi } from '../../api'
import { Users, Shield, Activity, Search } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  user:         'bg-blue-50 text-blue-700',
  psychologist: 'bg-violet-50 text-violet-700',
  director:     'bg-amber-50 text-amber-700',
  admin:        'bg-red-50 text-red-600',
}
const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь', psychologist: 'Психолог', director: 'Директор', admin: 'Администратор',
}

export default function AdminPanel() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'users' | 'settings'>('users')
  const [search, setSearch] = useState('')
  const [overview, setOverview] = useState<any>(null)

  useEffect(() => {
    Promise.all([usersApi.list(), analyticsApi.overview()])
      .then(([u, o]) => { setUsers(u.data); setOverview(o.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId: string, role: string) => {
    await usersApi.updateRole(userId, role)
    setUsers(u => u.map(usr => usr.id === userId ? { ...usr, role } : usr))
  }

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const byRole = (role: string) => users.filter(u => u.role === role).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Управление платформой и пользователями</p>
      </div>

      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Всего пользователей', value: overview.total_users, icon: Users, style: 'bg-blue-50 text-blue-600' },
            { label: 'Психологов', value: byRole('psychologist'), icon: Shield, style: 'bg-violet-50 text-violet-600' },
            { label: 'Директоров', value: byRole('director'), icon: Activity, style: 'bg-amber-50 text-amber-600' },
            { label: 'Критических', value: overview.critical_count, icon: Activity, style: 'bg-red-50 text-red-600' },
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
        {(['users', 'settings'] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t_
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t(`admin.${t_}`)}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="input pl-9"
              />
            </div>
            <span className="text-sm text-gray-500">{filtered.length} из {users.length}</span>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 font-semibold text-gray-600">{t('admin.name')}</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600">{t('admin.email')}</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600">{t('admin.group')}</th>
                      <th className="text-left px-4 py-3.5 font-semibold text-gray-600">{t('admin.role')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u: any) => {
                      const initials = u.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'
                      return (
                        <tr key={u.id} className="table-row">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {initials}
                              </div>
                              <span className="font-medium text-gray-800">{u.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-500">{u.email}</td>
                          <td className="px-4 py-3.5 text-gray-500">{u.group_name || '—'}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className={`badge ${ROLE_COLORS[u.role] || ROLE_COLORS.user} text-xs`}>
                                {ROLE_LABELS[u.role] || u.role}
                              </span>
                              <select
                                value={u.role}
                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white hover:border-gray-300 transition-colors"
                              >
                                <option value="user">Пользователь</option>
                                <option value="psychologist">Психолог</option>
                                <option value="director">Директор</option>
                                <option value="admin">Администратор</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-sm text-gray-400">Ничего не найдено</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card p-8 max-w-lg">
          <h3 className="text-base font-semibold text-gray-800 mb-5">Настройки учреждения</h3>
          <div className="space-y-4">
            {[
              { label: 'Название учреждения', placeholder: 'НИШ Алматы', type: 'text' },
              { label: 'Email администратора', placeholder: 'admin@school.kz', type: 'email' },
            ].map((f) => (
              <div key={f.label}>
                <label className="label">{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} className="input" />
              </div>
            ))}
            <button className="btn-primary mt-2">Сохранить изменения</button>
          </div>
        </div>
      )}
    </div>
  )
}
