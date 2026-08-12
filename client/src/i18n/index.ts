import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import hi from './hi';

export const SUPPORTED_LANGUAGES = ['en', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const LANG_STORAGE_KEY = 'estatehub_lang';

function getStoredLang(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY) as SupportedLanguage | null;
    return stored && SUPPORTED_LANGUAGES.includes(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

const resources = {
  en: { translation: en },
  hi: { translation: hi },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLang(),
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lng);
  } catch {
    // storage unavailable (private mode, etc.)
  }
});

export function setLanguage(lng: SupportedLanguage): void {
  void i18n.changeLanguage(lng);
}

export default i18n;