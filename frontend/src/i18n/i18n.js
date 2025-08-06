import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import enTranslations from './locales/en.json';
import grTranslations from './locales/gr.json';

i18n
  // Load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  // Learn more: https://github.com/i18next/i18next-http-backend
  .use(Backend)
  // Detect user language
  // Learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  // For all options read: https://www.i18next.com/overview/configuration-options
  .init({
    // Fallback language
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // Not needed for react as it escapes by default
    },

    // Language detection settings
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    // Resources (embedded translations)
    resources: {
      en: {
        translation: enTranslations
      },
      gr: {
        translation: grTranslations
      }
    },

    // Backend settings (if using external JSON files)
    backend: {
      loadPath: '/locales/{{lng}}.json',
    },

    // React-specific options
    react: {
      useSuspense: false
    }
  });

export default i18n;
