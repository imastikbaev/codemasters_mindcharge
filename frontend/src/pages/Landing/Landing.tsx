import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ClipboardList, BookOpen, BarChart2, Shield, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import LanguageSwitcher from '../../components/ui/LanguageSwitcher'

const LOGO_ICON = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
    <rect width="32" height="32" rx="9" fill="#6366f1"/>
    <path d="M8 16a8 8 0 0016 0" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
    <circle cx="11.5" cy="12.5" r="1.8" fill="white"/>
    <circle cx="20.5" cy="12.5" r="1.8" fill="white"/>
  </svg>
)

export default function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (user) { navigate('/dashboard'); return null }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <LOGO_ICON />
            <span className="font-bold text-gray-900 text-lg tracking-tight">MindCharge</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button onClick={() => navigate('/login')} className="btn-secondary text-sm">
              {t('auth.login')}
            </button>
            <button onClick={() => navigate('/register')} className="btn-primary text-sm">
              {t('landing.getStarted')}
            </button>
          </div>
        </div>
      </header>

      <section className="pt-20 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-600 border border-primary-100 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            {t('landing.badge') || 'Платформа для учебных заведений'}
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-5 leading-[1.15] tracking-tight">
            {t('landing.hero')}
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroSub')}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => navigate('/register')} className="btn-primary px-7 py-3 text-base">
              {t('landing.getStarted')}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button onClick={() => navigate('/login')} className="btn-secondary px-7 py-3 text-base">
              {t('auth.login')}
            </button>
          </div>
        </div>
      </section>

      <section className="py-10 px-6 border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-12 text-center">
          {[
            { value: '4', label: t('landing.statTests') },
            { value: '5', label: t('landing.statCourses') },
            { value: '25+', label: t('landing.statExercises') },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('landing.howTitle')}</h2>
            <p className="text-gray-500">{t('landing.howSub') || 'Три шага к психологическому благополучию'}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: ClipboardList, step: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc'), color: 'bg-blue-50 text-blue-600' },
              { icon: BarChart2, step: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc'), color: 'bg-primary-50 text-primary-600' },
              { icon: BookOpen, step: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc'), color: 'bg-green-50 text-green-600' },
            ].map((item) => (
              <div key={item.step} className="card p-7">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-gray-300 mb-1.5 tracking-widest">{item.step}</div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('landing.forWhom')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, title: t('landing.forStudents'), desc: t('landing.forStudentsDesc'), accent: 'text-blue-600 bg-blue-50' },
              { icon: TrendingUp, title: t('landing.forEmployees'), desc: t('landing.forEmployeesDesc'), accent: 'text-primary-600 bg-primary-50' },
              { icon: Shield, title: t('landing.forPsych'), desc: t('landing.forPsychDesc'), accent: 'text-violet-600 bg-violet-50' },
            ].map((item) => (
              <div key={item.title} className="card p-7">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${item.accent}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card p-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('landing.ctaTitle') || 'Готовы начать?'}</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">{t('landing.ctaSub') || 'Пройдите первый тест за 5 минут и получите персональные рекомендации.'}</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => navigate('/register')} className="btn-primary px-8 py-3 text-base">
                {t('landing.getStarted')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {[
                t('landing.feature1') || 'Бесплатно',
                t('landing.feature2') || 'Конфиденциально',
                t('landing.feature3') || 'Научный подход',
              ].map((f) => (
                <span key={f} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <LOGO_ICON />
            <span className="font-semibold text-gray-700">MindCharge</span>
          </div>
          <p className="text-sm text-gray-400">special for CodeMasters by smashariki</p>
        </div>
      </footer>
    </div>
  )
}
