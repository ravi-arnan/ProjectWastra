import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import id from './locales/id.json'
import en from './locales/en.json'

export const SUPPORTED_LANGS = ['id', 'en'] as const
export type AppLang = (typeof SUPPORTED_LANGS)[number]

const STORAGE_KEY = 'mango_lang'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: id },
      en: { translation: en },
    },
    fallbackLng: 'id',
    supportedLngs: SUPPORTED_LANGS,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

// Keep <html lang> in sync with the active language (WCAG 3.1.1) — the static
// attribute in index.html would otherwise go stale when the user switches.
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.split('-')[0]
  }
}
syncHtmlLang(i18n.resolvedLanguage ?? 'id')
i18n.on('languageChanged', syncHtmlLang)

export const setAppLanguage = (lang: AppLang) => {
  i18n.changeLanguage(lang)
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch {
    /* ignore */
  }
}

export default i18n
