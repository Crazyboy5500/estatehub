import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { setLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = i18n.language as SupportedLanguage;

  const change = (lng: SupportedLanguage): void => {
    setLanguage(lng);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-lg px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        aria-label="Change language"
      >
        {current === 'hi' ? 'हिंदी' : 'EN'}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-28 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              onClick={() => change(lng)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 ${
                lng === current ? 'font-semibold text-primary-600' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {lng === 'hi' ? 'हिंदी' : 'English'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}