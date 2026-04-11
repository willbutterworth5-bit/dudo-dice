import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ProfileStorage } from '../utils/profileStorage';
import en from './en';
import es from './es';
import type { Translations } from './types';

export type Language = 'en' | 'es';

const translations: Record<Language, Translations> = { en, es };

function resolve(obj: unknown, keys: string[]): string | undefined {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = ProfileStorage.getProfile().language;
    if (stored === 'es' || stored === 'en') return stored;
    return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    const profile = ProfileStorage.getProfile();
    ProfileStorage.saveProfile({ ...profile, language: lang });
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value = resolve(translations[language], keys);
    if (value === undefined) value = resolve(translations['en'], keys) ?? key;
    if (!params) return value;
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, String(v)),
      value,
    );
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
