import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from './locales/ru/common.json'
import en from './locales/en/common.json'
import kz from './locales/kz/common.json'

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
    en: { translation: en },
    kz: { translation: kz },
  },
  lng: localStorage.getItem('language') || 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
})

export default i18n
