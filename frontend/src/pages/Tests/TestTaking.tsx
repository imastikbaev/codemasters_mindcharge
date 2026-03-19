import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, CheckCircle, BookOpen, BarChart2 } from 'lucide-react'
import { testsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import LevelBadge from '../../components/ui/LevelBadge'

export default function TestTaking() {
  const { testId } = useParams<{ testId: string }>()
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const lang = user?.preferred_language || 'ru'

  const [test, setTest] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    if (!testId) return
    testsApi.get(testId)
      .then(res => {
        setTest(res.data)
        setAnswers(new Array(res.data.questions.length).fill(-1))
      })
      .catch(() => navigate('/tests'))
      .finally(() => setLoading(false))
  }, [testId])

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card p-6 animate-pulse h-32" />
      <div className="card p-6 animate-pulse h-64" />
    </div>
  )
  if (!test) return null

  const questions = test.questions
  const q = questions[current]
  const getQText = (q: any) => lang === 'kz' ? q.text_kz : lang === 'en' ? q.text_en : q.text_ru
  const getTestName = () => lang === 'kz' ? test.name_kz : lang === 'en' ? test.name_en : test.name_ru
  const isChild = user?.age_group === 'child'

  const scaleLabels: Record<string, string[]> = {
    ru: ['Никогда', 'Редко', 'Иногда', 'Часто', 'Всегда'],
    en: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    kz: ['Ешқашан', 'Сирек', 'Кейде', 'Жиі', 'Үнемі'],
  }
  const emojis = ['😊', '🙂', '😐', '😟', '😔']

  const handleAnswer = (val: number) => {
    const newAnswers = [...answers]
    newAnswers[current] = val
    setAnswers(newAnswers)
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 280)
    }
  }

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) return
    setSubmitting(true)
    try {
      const res = await testsApi.submit(testId!, answers)
      setResult(res.data)
    } catch {
      alert(t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    const score = Math.round(result.normalized_score)
    const scoreColor = score < 31 ? 'text-emerald-600' : score < 56 ? 'text-amber-600' : score < 76 ? 'text-orange-600' : 'text-red-600'
    const scoreBg = score < 31 ? 'bg-emerald-50 border-emerald-100' : score < 56 ? 'bg-amber-50 border-amber-100' : score < 76 ? 'bg-orange-50 border-orange-100' : 'bg-red-50 border-red-100'

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className={`card p-8 text-center border ${scoreBg}`}>
          <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">{getTestName()}</p>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('tests.resultTitle')}</h2>
          <div className="flex items-baseline justify-center gap-1 mb-3">
            <span className={`text-6xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-2xl text-gray-400">%</span>
          </div>
          <div className="flex justify-center">
            <LevelBadge level={result.ai_level} lang={lang} size="lg" />
          </div>
        </div>

        {result.ai_summary && (
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('tests.aiAnalysis')}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{result.ai_summary}</p>
          </div>
        )}

        {result.ai_recommendations_json?.length > 0 && (
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">{t('tests.recommendations')}</h3>
            <ul className="space-y-3">
              {result.ai_recommendations_json.map((rec: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => navigate('/courses')} className="btn-primary flex-1">
            <BookOpen className="w-4 h-4" />
            {t('tests.goToCourses')}
          </button>
          <button onClick={() => navigate('/results')} className="btn-secondary flex-1">
            <BarChart2 className="w-4 h-4" />
            {t('nav.results')}
          </button>
        </div>
      </div>
    )
  }

  const pct = ((current + 1) / questions.length) * 100
  const answered = answers.filter(a => a !== -1).length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">{getTestName()}</p>
            <p className="text-sm font-medium text-gray-700">
              Вопрос {current + 1} из {questions.length}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-primary-600">{Math.round(pct)}%</span>
            <p className="text-xs text-gray-400">выполнено</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex gap-1.5 mt-3">
          {questions.map((_: any, i: number) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-all duration-200 ${
                i < current ? 'bg-primary-400' : i === current ? 'bg-primary-600' : answers[i] !== -1 ? 'bg-primary-300' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="card p-8">
        <p className="text-lg font-medium text-gray-900 mb-8 leading-relaxed">{getQText(q)}</p>

        {isChild ? (
          <div className="flex justify-around gap-3">
            {emojis.map((emoji, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all flex-1 ${
                  answers[current] === i
                    ? 'border-primary-500 bg-primary-50 scale-105'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl">{emoji}</span>
                <span className="text-xs text-gray-500 font-medium">{i}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-gray-400 px-1">
              <span>{(scaleLabels[lang] || scaleLabels.ru)[0]}</span>
              <span>{(scaleLabels[lang] || scaleLabels.ru)[4]}</span>
            </div>
            <div className="flex justify-between gap-2">
              {Array.from({ length: q.scale_max - q.scale_min + 1 }, (_: any, i: number) => i + q.scale_min).map((val: number) => (
                <button
                  key={val}
                  onClick={() => handleAnswer(val)}
                  className={`flex-1 min-h-[52px] rounded-xl border-2 font-semibold text-sm transition-all ${
                    answers[current] === val
                      ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                      : 'border-gray-200 hover:border-primary-300 text-gray-700 hover:bg-primary-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 pt-5 border-t border-gray-100">
          <button
            onClick={() => setCurrent(c => Math.max(0, c - 1))}
            disabled={current === 0}
            className="btn-ghost gap-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('tests.prev')}
          </button>

          {current === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || answered < questions.length}
              className="btn-primary gap-1"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('tests.submitting')}
                </>
              ) : (
                <>
                  {t('tests.submit')}
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrent(c => Math.min(questions.length - 1, c + 1))}
              disabled={answers[current] === -1}
              className="btn-primary gap-1 disabled:opacity-40"
            >
              {t('tests.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
