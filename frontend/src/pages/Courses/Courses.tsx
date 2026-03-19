import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, BookOpen, Play, CheckCircle, Layers } from 'lucide-react'
import { coursesApi } from '../../api'
import { useAuthStore } from '../../store/authStore'

const THEME_META: Record<string, { color: string; bg: string; label: Record<string, string> }> = {
  stress:                 { color: 'text-blue-700',   bg: 'bg-blue-50',   label: { ru: 'Стресс', en: 'Stress', kz: 'Стресс' } },
  burnout:                { color: 'text-orange-700', bg: 'bg-orange-50', label: { ru: 'Выгорание', en: 'Burnout', kz: 'Күйіп-жану' } },
  emotional_intelligence: { color: 'text-violet-700', bg: 'bg-violet-50', label: { ru: 'Эмоц. интеллект', en: 'Emotional IQ', kz: 'Эмоц. интеллект' } },
  motivation:             { color: 'text-amber-700',  bg: 'bg-amber-50',  label: { ru: 'Мотивация', en: 'Motivation', kz: 'Мотивация' } },
  mindfulness:            { color: 'text-green-700',  bg: 'bg-green-50',  label: { ru: 'Mindfulness', en: 'Mindfulness', kz: 'Mindfulness' } },
}

const THEME_ICON_COLOR: Record<string, string> = {
  stress: 'text-blue-400', burnout: 'text-orange-400',
  emotional_intelligence: 'text-violet-400', motivation: 'text-amber-400', mindfulness: 'text-green-400',
}

export default function Courses() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<any[]>([])
  const [progress, setProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const lang = user?.preferred_language || 'ru'

  useEffect(() => {
    Promise.all([coursesApi.list(), coursesApi.myProgress()])
      .then(([c, p]) => { setCourses(c.data); setProgress(p.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getName = (c: any) => lang === 'kz' ? c.name_kz : lang === 'en' ? c.name_en : c.name_ru
  const getDesc = (c: any) => lang === 'kz' ? c.description_kz : lang === 'en' ? c.description_en : c.description_ru
  const getProgress = (courseId: string) => progress.find((p: any) => p.course_id === courseId)

  const filters = [
    { key: 'all', label: 'Все' },
    { key: 'active', label: 'В процессе' },
    { key: 'done', label: 'Завершено' },
    { key: 'new', label: 'Новые' },
  ]

  const filtered = courses.filter((course: any) => {
    const prog = getProgress(course.id)
    if (activeFilter === 'active') return prog && !prog.completed_at
    if (activeFilter === 'done') return prog?.completed_at
    if (activeFilter === 'new') return !prog
    return true
  })

  if (loading) return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[...Array(5)].map((_, i) => <div key={i} className="card h-56 animate-pulse" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('courses.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('courses.subtitle')}</p>
        </div>
        <span className="badge bg-primary-50 text-primary-700 text-sm px-3 py-1.5">
          {courses.length} курсов
        </span>
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeFilter === f.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((course: any) => {
          const prog = getProgress(course.id)
          const isCompleted = prog?.completed_at
          const isStarted = prog && !isCompleted
          const modulesDone = prog?.completed_modules?.length || 0
          const totalModules = course.modules?.length || 4
          const pct = totalModules > 0 ? Math.round((modulesDone / totalModules) * 100) : 0
          const meta = THEME_META[course.theme] || THEME_META.stress
          const iconColor = THEME_ICON_COLOR[course.theme] || 'text-gray-400'

          return (
            <div
              key={course.id}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="card-hover overflow-hidden flex flex-col"
            >
              <div className={`${meta.bg} px-6 pt-6 pb-5 flex items-start justify-between`}>
                <div>
                  <span className={`badge ${meta.bg} ${meta.color} border border-current/20 text-xs mb-3`}>
                    {meta.label[lang] || meta.label.ru}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-base leading-snug pr-2">{getName(course)}</h3>
                </div>
                <BookOpen className={`w-8 h-8 flex-shrink-0 ${iconColor}`} />
              </div>

              <div className="p-5 flex flex-col flex-1">
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">{getDesc(course)}</p>

                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {course.estimated_hours} ч.
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    {totalModules} {t('courses.modules')}
                  </span>
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-emerald-600 ml-auto">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Завершён
                    </span>
                  )}
                </div>

                {isStarted && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>{modulesDone} из {totalModules} модулей</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                <button className={`w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                  isCompleted
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : isStarted
                    ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                    : 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                }`}>
                  {isCompleted ? (
                    <><CheckCircle className="w-4 h-4" /> {t('courses.completed')}</>
                  ) : isStarted ? (
                    <><Play className="w-4 h-4" /> {t('courses.continue')}</>
                  ) : (
                    <><Play className="w-4 h-4" /> {t('courses.startCourse')}</>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500">Нет курсов в этой категории</p>
        </div>
      )}
    </div>
  )
}
