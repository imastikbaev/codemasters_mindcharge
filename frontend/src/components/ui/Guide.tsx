import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HelpCircle, X, ChevronRight, ChevronLeft, Map, BookOpen, ClipboardList, BarChart3, MessageCircle, Info } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

const LEVEL_INFO = {
  ru: [
    { key: 'norm', color: 'bg-green-100 border-green-300 text-green-800', dot: 'bg-green-500', label: 'Норма (0–30%)', desc: 'Ваше эмоциональное состояние стабильно. Продолжайте поддерживать баланс — хороший сон, физическая активность, общение с близкими.' },
    { key: 'elevated', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', dot: 'bg-yellow-500', label: 'Повышенный стресс (31–55%)', desc: 'Уровень стресса выше нормы. Это сигнал: нужно уделить время восстановлению. Попробуйте дыхательные техники и курс по управлению стрессом.' },
    { key: 'burnout_risk', color: 'bg-orange-100 border-orange-300 text-orange-800', dot: 'bg-orange-500', label: 'Риск выгорания (56–75%)', desc: 'Организм работает на износ. Важно снизить нагрузку, пройти курс профилактики выгорания и поговорить с кем-то близким или психологом.' },
    { key: 'critical', color: 'bg-red-100 border-red-300 text-red-800', dot: 'bg-red-500', label: 'Критическое состояние (76–100%)', desc: 'Требуется поддержка специалиста. Пожалуйста, обратитесь к психологу учреждения. Это не слабость — это забота о себе.' },
  ],
  en: [
    { key: 'norm', color: 'bg-green-100 border-green-300 text-green-800', dot: 'bg-green-500', label: 'Normal (0–30%)', desc: 'Your emotional state is stable. Keep maintaining balance — good sleep, physical activity, and communication with loved ones.' },
    { key: 'elevated', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', dot: 'bg-yellow-500', label: 'Elevated Stress (31–55%)', desc: 'Stress level is above normal. Take time to recover. Try breathing techniques and a stress management course.' },
    { key: 'burnout_risk', color: 'bg-orange-100 border-orange-300 text-orange-800', dot: 'bg-orange-500', label: 'Burnout Risk (56–75%)', desc: 'Your body is working at its limit. Reduce workload, take the burnout prevention course, and talk to someone you trust.' },
    { key: 'critical', color: 'bg-red-100 border-red-300 text-red-800', dot: 'bg-red-500', label: 'Critical State (76–100%)', desc: 'Professional support is needed. Please contact your institution\'s psychologist. Seeking help is a sign of strength.' },
  ],
  kz: [
    { key: 'norm', color: 'bg-green-100 border-green-300 text-green-800', dot: 'bg-green-500', label: 'Қалыпты (0–30%)', desc: 'Эмоционалдық жағдайыңыз тұрақты. Тепе-теңдікті сақтауды жалғастырыңыз.' },
    { key: 'elevated', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', dot: 'bg-yellow-500', label: 'Жоғары стресс (31–55%)', desc: 'Стресс деңгейі жоғары. Демалуға уақыт бөліңіз. Тыныс алу техникалары мен стрессті басқару курсын қолданып көріңіз.' },
    { key: 'burnout_risk', color: 'bg-orange-100 border-orange-300 text-orange-800', dot: 'bg-orange-500', label: 'Күйіп-жану қаупі (56–75%)', desc: 'Дененіз шегіне жетіп жатыр. Жүктемені азайтып, психологпен сөйлесіңіз.' },
    { key: 'critical', color: 'bg-red-100 border-red-300 text-red-800', dot: 'bg-red-500', label: 'Сын жағдай (76–100%)', desc: 'Маман көмегі қажет. Мекеменің психологына жүгініңіз.' },
  ],
}

const PAGE_TIPS = {
  ru: {
    '/dashboard': {
      icon: Map,
      title: 'Ваш дашборд',
      tips: [
        'Здесь отображается ваше текущее эмоциональное состояние по последнему тесту.',
        'График показывает динамику состояния — как менялся уровень стресса со временем.',
        'Активные курсы показывают прогресс по обучению.',
        'Используйте быстрые действия для старта теста или курса одним кликом.',
      ],
    },
    '/tests': {
      icon: ClipboardList,
      title: 'Психологические тесты',
      tips: [
        'PSS-10 — самый популярный тест на стресс. Займёт 5–7 минут.',
        'GAD-7 измеряет уровень тревожности за последние 2 недели.',
        'MBI (выгорание) рекомендуется проходить раз в месяц.',
        'Тест на мотивацию покажет, насколько вы заряжены на учёбу или работу.',
        'Отвечайте честно — результаты видны только вам и психологу учреждения.',
      ],
    },
    '/courses': {
      icon: BookOpen,
      title: 'Обучающие курсы',
      tips: [
        'Курсы подбираются автоматически на основе ваших результатов тестов.',
        'Каждый курс состоит из модулей: теория, видео, упражнение, мини-тест.',
        'Можно проходить в любом темпе — прогресс сохраняется автоматически.',
        '5 тем: стресс, выгорание, эмоциональный интеллект, мотивация, mindfulness.',
      ],
    },
    '/results': {
      icon: BarChart3,
      title: 'Ваши результаты',
      tips: [
        'График показывает динамику нормализованного балла от 0 до 100%.',
        'Нажмите на любой результат, чтобы увидеть AI-анализ и рекомендации.',
        'Чем ниже балл — тем лучше состояние (для тестов стресса и тревоги).',
        'История хранится только у вас и вашего психолога (если вы дали согласие).',
      ],
    },
    '/assistant': {
      icon: MessageCircle,
      title: 'AI-ассистент EMi',
      tips: [
        'EMi — живой собеседник, не просто бот. Рассказывайте как другу.',
        'Он помнит контекст в рамках одной сессии — можно продолжать разговор.',
        'Можно говорить голосом — нажмите на иконку микрофона.',
        'Быстрые кнопки снизу помогут начать разговор, если не знаете с чего.',
        'EMi не ставит диагнозы и не заменяет психолога — он рядом поддержать.',
      ],
    },
    '/psychologist': {
      icon: BarChart3,
      title: 'Панель психолога',
      tips: [
        'Обзор показывает общую картину по всем пользователям учреждения.',
        'Вкладка "По группам" — сравнение состояния по классам/отделам.',
        'Критические случаи — пользователи с уровнем "критическое состояние".',
        'При критическом результате теста вы получаете уведомление автоматически.',
        'Кнопка "Скачать отчёт" экспортирует данные в CSV.',
      ],
    },
    '/admin': {
      icon: Map,
      title: 'Администрирование',
      tips: [
        'Управление пользователями: смена роли (пользователь / психолог / директор).',
        'Деактивация аккаунта скрывает пользователя, не удаляя данные.',
        'Вкладка "Настройки" — параметры учреждения.',
      ],
    },
  },
  en: {
    '/dashboard': { icon: Map, title: 'Your Dashboard', tips: ['Shows your current emotional state from the latest test.', 'The chart tracks your stress level over time.', 'Active courses show your learning progress.'] },
    '/tests': { icon: ClipboardList, title: 'Psychological Tests', tips: ['PSS-10 is the most popular stress test. Takes 5–7 minutes.', 'GAD-7 measures anxiety over the past 2 weeks.', 'Answer honestly — results are only visible to you and your psychologist.'] },
    '/courses': { icon: BookOpen, title: 'Learning Courses', tips: ['Courses are matched to your test results automatically.', 'Each course has modules: theory, video, exercise, quiz.', 'Progress is saved automatically.'] },
    '/results': { icon: BarChart3, title: 'Your Results', tips: ['Click any result to see AI analysis and recommendations.', 'History is private — only you and your psychologist can see it.'] },
    '/assistant': { icon: MessageCircle, title: 'AI Assistant EMi', tips: ['EMi remembers context within a session.', 'You can use voice input — tap the microphone icon.', 'EMi is a support companion, not a replacement for a psychologist.'] },
  },
  kz: {
    '/dashboard': { icon: Map, title: 'Басқару тақтаңыз', tips: ['Соңғы тест бойынша эмоционалдық жағдайыңызды көрсетеді.', 'График стресс деңгейінің динамикасын көрсетеді.'] },
    '/tests': { icon: ClipboardList, title: 'Психологиялық тесттер', tips: ['PSS-10 — ең танымал стресс тесті. 5–7 минут алады.', 'Шынайы жауап беріңіз — нәтижелер тек сізге көрінеді.'] },
    '/courses': { icon: BookOpen, title: 'Оқу курстары', tips: ['Курстар тест нәтижелері бойынша автоматты таңдалады.', 'Прогресс автоматты сақталады.'] },
    '/results': { icon: BarChart3, title: 'Менің нәтижелерім', tips: ['Нәтижені басып AI-талдауды көруге болады.'] },
    '/assistant': { icon: MessageCircle, title: 'AI-ассистент EMi', tips: ['EMi сессия ішінде контекстті есте сақтайды.', 'Дауыстық енгізуді қолдануға болады.'] },
  },
}

const TOUR_STEPS = {
  ru: [
    { path: '/dashboard', icon: '🏠', title: 'Добро пожаловать в MindCharge!', desc: 'Дашборд — ваша отправная точка. Здесь вы видите текущее состояние, активные курсы и историю.' },
    { path: '/tests', icon: '📋', title: 'Шаг 1: Пройдите тест', desc: 'Начните с психологического теста — это займёт 5–10 минут. AI проанализирует ответы и определит ваш уровень.' },
    { path: '/results', icon: '📊', title: 'Шаг 2: Изучите результаты', desc: 'После теста вы увидите уровень состояния, AI-анализ и персональные рекомендации.' },
    { path: '/courses', icon: '📚', title: 'Шаг 3: Начните курс', desc: 'На основе результатов AI подберёт подходящий курс. Проходите в своём темпе — прогресс сохраняется.' },
    { path: '/assistant', icon: '💬', title: 'Шаг 4: Поговорите с EMi', desc: 'Если нужна поддержка прямо сейчас — AI-ассистент EMi всегда рядом. Говорите как с другом.' },
  ],
  en: [
    { path: '/dashboard', icon: '🏠', title: 'Welcome to MindCharge!', desc: 'The dashboard is your starting point. See your current state, active courses, and history.' },
    { path: '/tests', icon: '📋', title: 'Step 1: Take a Test', desc: 'Start with a psychological test — it takes 5–10 minutes. AI will analyze your answers.' },
    { path: '/results', icon: '📊', title: 'Step 2: Review Results', desc: 'After the test you\'ll see your state level, AI analysis, and personalized recommendations.' },
    { path: '/courses', icon: '📚', title: 'Step 3: Start a Course', desc: 'AI will suggest the right course based on your results.' },
    { path: '/assistant', icon: '💬', title: 'Step 4: Chat with EMi', desc: 'Need support right now? EMi is always here — talk like with a friend.' },
  ],
  kz: [
    { path: '/dashboard', icon: '🏠', title: 'MindCharge-қа қош келдіңіз!', desc: 'Басқару тақтасы — бастапқы нүктеңіз. Ағымдағы жағдайды, курстар мен тарихты көріңіз.' },
    { path: '/tests', icon: '📋', title: '1-қадам: Тест тапсырыңыз', desc: '5–10 минуттық психологиялық тестпен бастаңыз.' },
    { path: '/results', icon: '📊', title: '2-қадам: Нәтижелерді қараңыз', desc: 'Тесттен кейін жағдай деңгейі мен AI-талдауды көресіз.' },
    { path: '/courses', icon: '📚', title: '3-қадам: Курс бастаңыз', desc: 'AI нәтижелер бойынша курс ұсынады.' },
    { path: '/assistant', icon: '💬', title: '4-қадам: EMiмен сөйлесіңіз', desc: 'Қолдау керек пе? EMi әрқашан жақын.' },
  ],
}

type Tab = 'page' | 'levels' | 'tour'

export default function Guide() {
  const { user } = useAuthStore()
  const { i18n } = useTranslation()
  const location = useLocation()
  const lang = (i18n.language as 'ru' | 'en' | 'kz') || 'ru'

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('page')
  const [tourStep, setTourStep] = useState(0)

  if (!user) return null

  const langTips = (PAGE_TIPS[lang] || PAGE_TIPS.ru) as Record<string, { icon: any; title: string; tips: string[] }>
  const pageTips = langTips[location.pathname] as { icon: any; title: string; tips: string[] } | undefined
  const levels = LEVEL_INFO[lang] || LEVEL_INFO.ru
  const tourSteps = TOUR_STEPS[lang] || TOUR_STEPS.ru
  const currentTour = tourSteps[tourStep]

  const LABELS = {
    ru: { page: 'Эта страница', levels: 'Уровни', tour: 'Тур', close: 'Закрыть', guide: 'Проводник', prev: 'Назад', next: 'Далее', done: 'Готово!', tipCount: (n: number) => `${n} подсказок`, noTips: 'Для этой страницы подсказок нет.' },
    en: { page: 'This Page', levels: 'Levels', tour: 'Tour', close: 'Close', guide: 'Guide', prev: 'Back', next: 'Next', done: 'Done!', tipCount: (n: number) => `${n} tips`, noTips: 'No tips for this page.' },
    kz: { page: 'Бұл бет', levels: 'Деңгейлер', tour: 'Тур', close: 'Жабу', guide: 'Нұсқаушы', prev: 'Артқа', next: 'Келесі', done: 'Дайын!', tipCount: (n: number) => `${n} кеңес`, noTips: 'Бұл бет үшін кеңес жоқ.' },
  }
  const L = LABELS[lang] || LABELS.ru

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(true); setTab('page') }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title={L.guide}
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: '80vh' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <HelpCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">{L.guide}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['page', 'levels', 'tour'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === t ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t === 'page' ? L.page : t === 'levels' ? L.levels : L.tour}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1">

            {/* Page tips */}
            {tab === 'page' && (
              <div className="p-4">
                {pageTips ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                        <pageTips.icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{pageTips.title}</p>
                        <p className="text-xs text-gray-400">{L.tipCount(pageTips.tips.length)}</p>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {pageTips.tips.map((tip: string, i: number) => (
                        <li key={i} className="flex gap-2.5 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Info className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{L.noTips}</p>
                  </div>
                )}
              </div>
            )}

            {/* Level explanation */}
            {tab === 'levels' && (
              <div className="p-4 space-y-3">
                {levels.map(lvl => (
                  <div key={lvl.key} className={`p-3 rounded-xl border ${lvl.color}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${lvl.dot}`} />
                      <span className="font-semibold text-sm">{lvl.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">{lvl.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Tour */}
            {tab === 'tour' && (
              <div className="p-4">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{currentTour.icon}</div>
                  <h3 className="font-bold text-gray-800 text-sm">{currentTour.title}</h3>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{currentTour.desc}</p>
                </div>

                {/* Step dots */}
                <div className="flex justify-center gap-1.5 mb-4">
                  {tourSteps.map((_, i) => (
                    <button key={i} onClick={() => setTourStep(i)} className={`w-2 h-2 rounded-full transition-all ${i === tourStep ? 'bg-primary-500 w-4' : 'bg-gray-300'}`} />
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setTourStep(s => Math.max(0, s - 1))}
                    disabled={tourStep === 0}
                    className="flex-1 btn-secondary text-xs py-2 disabled:opacity-40 gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" /> {L.prev}
                  </button>
                  {tourStep < tourSteps.length - 1 ? (
                    <button onClick={() => setTourStep(s => s + 1)} className="flex-1 btn-primary text-xs py-2 gap-1">
                      {L.next} <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <button onClick={() => setOpen(false)} className="flex-1 btn-primary text-xs py-2">
                      {L.done}
                    </button>
                  )}
                </div>

                <p className="text-center text-xs text-gray-400 mt-2">{tourStep + 1} / {tourSteps.length}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
