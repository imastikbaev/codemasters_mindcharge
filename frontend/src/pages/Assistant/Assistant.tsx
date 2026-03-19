import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, MessageSquare, Mic, MicOff } from 'lucide-react'
import { aiApi, testsApi } from '../../api'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

interface Message { role: 'user' | 'assistant'; content: string }

const INITIALS_COLORS = ['bg-blue-100 text-blue-700', 'bg-violet-100 text-violet-700', 'bg-emerald-100 text-emerald-700']

const LEVEL_GREET: Record<string, Record<string, string>> = {
  norm:         { ru: 'Ваш последний результат — норма. Это хороший знак!', en: 'Your last result looks good — within normal range!', kz: 'Соңғы нәтижеңіз қалыпты. Бұл жақсы белгі!' },
  elevated:     { ru: 'Вижу, что у вас был повышенный стресс по последнему тесту. Как сейчас?', en: "I see your last test showed elevated stress. How are you feeling now?", kz: 'Соңғы тестте жоғары стресс байқалды. Қазір қалайсыз?' },
  burnout_risk: { ru: 'Замечаю, что ваш последний тест показал риск выгорания. Хочу поговорить об этом.', en: 'Your last test showed burnout risk. I want to talk about that.', kz: 'Соңғы тестіңізде күйіп-жану қаупі байқалды. Осы туралы сөйлескім келеді.' },
  critical:     { ru: 'Вижу ваш последний результат. Хочу убедиться, что вы в порядке. Как вы сейчас?', en: "I've seen your last result. I want to make sure you're okay. How are you right now?", kz: 'Соңғы нәтижеңізді көрдім. Жағдайыңыз жақсы екеніне көз жеткізгім келеді.' },
}

export default function Assistant() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const lang = user?.preferred_language || 'ru'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    testsApi.mySessions().then(res => {
      const last = res.data?.[0]
      let greeting = lang === 'en'
        ? "Hi! I'm EMi, your MindCharge assistant. How are you feeling today?"
        : lang === 'kz'
        ? 'Сәлем! Мен EMi — MindCharge ассистентіңізмін. Бүгін өзіңізді қалай сезінесіз?'
        : 'Привет! Я EMi — ваш ассистент MindCharge. Как вы себя чувствуете сегодня?'

      if (last?.ai_level) {
        const extra = LEVEL_GREET[last.ai_level]?.[lang] || ''
        if (extra) greeting = greeting + ' ' + extra
      }
      setMessages([{ role: 'assistant', content: greeting }])
    }).catch(() => {
      setMessages([{ role: 'assistant', content: lang === 'en'
        ? "Hi! I'm EMi. How are you feeling today?"
        : lang === 'kz' ? 'Сәлем! Мен EMi. Бүгін қалайсыз?'
        : 'Привет! Я EMi. Как вы себя чувствуете сегодня?' }])
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setMessages(m => [...m, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    try {
      const res = await aiApi.chat(text, sessionId, lang)
      setSessionId(res.data.session_id)
      setMessages(m => [...m, { role: 'assistant', content: res.data.reply }])
      if (res.data.actions?.length) {
        res.data.actions.forEach((a: any) => {
          if (a.type === 'suggest_test') setTimeout(() => navigate('/tests'), 1500)
          if (a.type === 'suggest_course') setTimeout(() => navigate('/courses'), 1500)
        })
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: t('common.error') }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const toggleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (listening) { recognitionRef.current?.stop(); setListening(false); return }
    const rec = new SR()
    rec.lang = lang === 'kz' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU'
    rec.onresult = (e: any) => { setInput(e.results[0][0].transcript); setListening(false) }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  const quickActions = [
    t('assistant.qa1'), t('assistant.qa2'), t('assistant.qa3'), t('assistant.qa4'),
  ]

  const userInitials = user?.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 6rem)' }}>
      <div className="flex items-center gap-4 pb-4 border-b border-gray-100 mb-4 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-base font-bold text-gray-900">{t('assistant.title')}</h1>
          <p className="text-xs text-gray-500">{t('assistant.subtitle')}</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-500">онлайн</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-4 pr-1 mb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {m.role === 'assistant' ? (
              <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">E</div>
            ) : (
              <div className={`w-8 h-8 rounded-xl text-xs font-bold flex items-center justify-center flex-shrink-0 ${INITIALS_COLORS[0]}`}>{userInitials}</div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-md'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-md shadow-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">E</div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0 space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => sendMessage(a)} className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors">
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
            placeholder={t('assistant.placeholder')}
            className="input flex-1 py-3"
          />
          <button onClick={toggleVoice} className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${listening ? 'bg-red-50 border-red-300 text-red-500' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="btn-primary w-11 h-11 rounded-xl flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
