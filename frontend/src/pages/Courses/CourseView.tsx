import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, CheckCircle, PlayCircle, FileText, Dumbbell, HelpCircle, ChevronRight } from 'lucide-react'
import { coursesApi } from '../../api'
import { useAuthStore } from '../../store/authStore'

const MODULE_ICONS: Record<string, any> = {
  video: PlayCircle, text: FileText, exercise: Dumbbell, quiz: HelpCircle,
}
const MODULE_TYPE_LABELS: Record<string, Record<string, string>> = {
  ru: { video: 'Видео', text: 'Теория', exercise: 'Практика', quiz: 'Тест' },
  en: { video: 'Video', text: 'Theory', exercise: 'Exercise', quiz: 'Quiz' },
  kz: { video: 'Бейне', text: 'Теория', exercise: 'Жаттығу', quiz: 'Тест' },
}

export default function CourseView() {
  const { courseId } = useParams<{ courseId: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const lang = user?.preferred_language || 'ru'

  const [course, setCourse] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [activeModule, setActiveModule] = useState(0)
  const [loading, setLoading] = useState(true)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)

  useEffect(() => {
    if (!courseId) return
    Promise.all([coursesApi.get(courseId), coursesApi.myProgress()])
      .then(([c, p]) => {
        setCourse(c.data)
        const prog = p.data.find((x: any) => x.course_id === courseId)
        setProgress(prog)
        if (prog) setActiveModule(prog.current_module || 0)
      })
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return (
    <div className="max-w-4xl mx-auto flex gap-4">
      <div className="w-52 card h-64 animate-pulse" />
      <div className="flex-1 card h-64 animate-pulse" />
    </div>
  )
  if (!course) return null

  const modules = course.modules || []
  const mod = modules[activeModule]
  const completedModules = progress?.completed_modules || []
  const getName = (c: any) => lang === 'kz' ? c.name_kz : lang === 'en' ? c.name_en : c.name_ru
  const getTitle = (m: any) => lang === 'kz' ? m.title_kz : lang === 'en' ? m.title_en : m.title_ru
  const typeLabels = MODULE_TYPE_LABELS[lang] || MODULE_TYPE_LABELS.ru

  const handleStart = async () => {
    if (!progress) {
      await coursesApi.start(courseId!)
      const prog = await coursesApi.myProgress()
      setProgress(prog.data.find((x: any) => x.course_id === courseId))
    }
  }

  const handleNextModule = async () => {
    await coursesApi.updateProgress(courseId!, activeModule)
    if (activeModule < modules.length - 1) {
      setActiveModule(m => m + 1)
      setQuizSubmitted(false)
      setQuizAnswers({})
    } else {
      navigate('/courses')
    }
  }

  const renderModule = (m: any) => {
    const content = m.content_json || {}
    switch (m.type) {
      case 'text':
        return (
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed text-base">{content.text}</p>
            {content.duration_min && (
              <p className="text-sm text-gray-400 flex items-center gap-1.5">
                ~{content.duration_min} мин на чтение
              </p>
            )}
          </div>
        )
      case 'video':
        return (
          <div className="space-y-4">
            {content.description && <p className="text-sm text-gray-600 leading-relaxed">{content.description}</p>}
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900">
              <iframe src={content.video_url} className="w-full h-full" allowFullScreen title={getTitle(m)} />
            </div>
          </div>
        )
      case 'exercise':
        return (
          <div className="space-y-4">
            <ol className="space-y-3">
              {(content.steps || []).map((step: string, i: number) => (
                <li key={i} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="text-gray-700 text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            {content.duration_min && <p className="text-sm text-gray-400">~{content.duration_min} мин</p>}
          </div>
        )
      case 'quiz':
        return (
          <div className="space-y-5">
            {(content.questions || []).map((q: any, qi: number) => (
              <div key={qi} className="space-y-3">
                <p className="font-medium text-gray-800">{q.text}</p>
                <div className="space-y-2">
                  {q.options.map((opt: string, oi: number) => {
                    let cls = 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    if (quizSubmitted) {
                      if (oi === q.correct) cls = 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      else if (quizAnswers[qi] === oi) cls = 'border-red-300 bg-red-50 text-red-600'
                      else cls = 'border-gray-100 text-gray-400'
                    } else if (quizAnswers[qi] === oi) {
                      cls = 'border-primary-500 bg-primary-50 text-primary-700'
                    }
                    return (
                      <button
                        key={oi}
                        onClick={() => !quizSubmitted && setQuizAnswers(a => ({ ...a, [qi]: oi }))}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${cls}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {!quizSubmitted && (
              <button
                onClick={() => setQuizSubmitted(true)}
                className="btn-primary"
                disabled={Object.keys(quizAnswers).length < (content.questions?.length || 0)}
              >
                Проверить ответы
              </button>
            )}
            {quizSubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                ✓ Тест завершён. Переходите к следующему модулю.
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const totalDone = completedModules.length
  const pct = modules.length > 0 ? Math.round((totalDone / modules.length) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/courses')} className="btn-ghost gap-1">
          <ChevronLeft className="w-4 h-4" />
          {t('common.back')}
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">{getName(course)}</h1>
        </div>
        <span className="text-sm text-gray-500 flex-shrink-0">{pct}% выполнено</span>
      </div>

      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex gap-5">
        <div className="w-52 flex-shrink-0">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Модули</p>
            </div>
            <div className="divide-y divide-gray-50">
              {modules.map((m: any, i: number) => {
                const Icon = MODULE_ICONS[m.type] || FileText
                const done = completedModules.includes(i)
                const active = i === activeModule
                return (
                  <button
                    key={i}
                    onClick={() => { setActiveModule(i); setQuizSubmitted(false); setQuizAnswers({}) }}
                    className={`w-full flex items-start gap-2.5 px-4 py-3 text-left transition-colors text-sm ${
                      active ? 'bg-primary-50' : 'hover:bg-gray-50/60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      done ? 'bg-emerald-100' : active ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      {done
                        ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        : <Icon className={`w-3.5 h-3.5 ${active ? 'text-primary-600' : 'text-gray-500'}`} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate font-medium ${active ? 'text-primary-700' : done ? 'text-gray-500' : 'text-gray-700'}`}>
                        {getTitle(m) || `${typeLabels[m.type] || m.type} ${i + 1}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{typeLabels[m.type] || m.type}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 card p-7">
          {mod && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge bg-primary-50 text-primary-700 text-xs">{typeLabels[mod.type] || mod.type}</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">{getTitle(mod)}</h2>
              {renderModule(mod)}
              <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm text-gray-400">{activeModule + 1} из {modules.length} модулей</span>
                <button
                  onClick={async () => { await handleStart(); handleNextModule() }}
                  className="btn-primary gap-2"
                >
                  {activeModule === modules.length - 1 ? t('courses.finish') : t('courses.next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
