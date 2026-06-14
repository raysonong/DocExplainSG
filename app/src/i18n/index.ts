/**
 * i18next setup for UI chrome localization.
 *
 * Plurals are handled in components via explicit page/pages keys rather than
 * i18next's Intl-based pluralization, which keeps behaviour predictable on
 * Hermes across all four languages.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { AppLanguage } from '../types';
import en from './locales/en.json';
import ms from './locales/ms.json';
import ta from './locales/ta.json';
import zh from './locales/zh.json';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'zh', 'ms', 'ta'];

/** Native-script names for the language selector. */
export const NATIVE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  zh: '中文',
  ms: 'Melayu',
  ta: 'தமிழ்',
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    zh: { translation: zh },
    ms: { translation: ms },
    ta: { translation: ta },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
