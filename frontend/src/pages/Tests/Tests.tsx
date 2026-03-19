import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Clock, ChevronRight, ClipboardList, CheckCircle } from 'lucide-react'
import { testsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'

const TYPE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  stress:     { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  anxiety:    { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  burnout:    { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
  motivation: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-400' },
  emotional:  { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
}
const TYPE_LABELS: Record<string, Record<string, string>> = {
  ru: { stress: 'Стресс', anxiety: 'Тревожность', burnout: 'Выгорание', motivation: 'Мотивация', emotional: 'Эмоции' },
  en: { stress: 'Stress', anxiety: 'Anxiety', burnout: 'Burnout', motivation: 'Motivation', emotional: 'Emotional' },
  kz: { stress: 'Стресс', anxiety: 'Мазасыздық', burnout: 'Күйіп-жану', motivation: 'Мотивация', emotional: 'Эмоция' },
}

export default function Tests() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const lang = user?.preferred_language || 'ru'

  useEffect(() => {
    testsApi.list()
      .then(res => setTests(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const getName = (test: any) => lang === 'kz' ? test.name_kz : lang === 'en' ? test.name_en : test.name_ru
  const getDesc = (test: any) => lang === 'kz' ? test.description_kz : lang === 'en' ? test.description_en : test.description_ru

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('tests.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('tests.subtitle')}</p>
      </div>

      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">{tests.length} тестов доступно</span>
          <span className="text-xs text-gray-400">Нажмите на тест для прохождения</span>
        </div>
        <div className="divide-y divide-gray-50">
          {tests.map((test) => {
            const style = TYPE_COLORS[test.type] || TYPE_COLORS.stress
            const typeLabel = (TYPE_LABELS[lang] || TYPE_LABELS.ru)[test.type] || test.type
            return (
              <div
                key={test.id}
                onClick={() => navigate(`/tests/${test.id}`)}
                className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/60 cursor-pointer transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                  <ClipboardList className={`w-5 h-5 ${style.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-gray-900 text-sm">{getName(test)}</h3>
                    <span className={`badge ${style.bg} ${style.text} border-0`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      {typeLabel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{getDesc(test)}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-medium text-gray-700">{test.questions?.length || '?'} вопросов</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {test.estimated_minutes} мин
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card p-5 bg-primary-50 border-primary-100">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary-800">Конфиденциальность гарантирована</p>
            <p className="text-sm text-primary-600 mt-0.5">Результаты видят только вы и ваш психолог учреждения. Все данные шифруются.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
