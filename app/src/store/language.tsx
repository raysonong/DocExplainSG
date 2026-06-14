/**
 * The single source of truth for the chosen language. It drives BOTH the UI
 * chrome (via i18next) AND the AI output language sent to the backend, so the
 * user picks once and everything follows. The choice is persisted and restored
 * on next launch (spec §4.2 "remember last choice").
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import i18n, { SUPPORTED_LANGUAGES } from '../i18n';
import { setFontLanguage } from '../lib/typography';
import type { AppLanguage } from '../types';

const STORAGE_KEY = 'docexplainsg.language';

function isSupported(code: string | null | undefined): code is AppLanguage {
  return !!code && (SUPPORTED_LANGUAGES as string[]).includes(code);
}

/** Best-guess default from the device locale, falling back to English. */
function deviceDefault(): AppLanguage {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : 'en';
}

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<AppLanguage>('en');

  // Restore the saved choice (or device default) on first mount.
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const initial = isSupported(saved) ? saved : deviceDefault();
      setFontLanguage(initial);
      await i18n.changeLanguage(initial);
      setLang(initial);
    })();
  }, []);

  const setLanguage = (lang: AppLanguage) => {
    setFontLanguage(lang);
    setLang(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch(() => {
      /* non-fatal: choice just won't persist */
    });
  };

  const value = useMemo<LanguageState>(
    () => ({ language, setLanguage }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageState {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
