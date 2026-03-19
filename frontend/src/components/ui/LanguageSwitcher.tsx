import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../store/authStore'
import { usersApi } from '../../api'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'ru', label: 'RU' },
  { code: 'kz', label: 'KZ' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const { user, updateLanguage } = useAuthStore()

  const handleChange = async (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
    updateLanguage(lang)
    if (user) {
      try { await usersApi.updateLanguage(lang) } catch {}
    }
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <Globe className="w-3.5 h-3.5 text-gray-500 ml-1" />
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            i18n.language === lang.code
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
