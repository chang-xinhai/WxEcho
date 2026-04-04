import { createContext, useContext, useState, ReactNode } from 'react';
import { translations } from './i18n';

type TranslationSet = typeof translations.zh;

interface LanguageContextValue {
  lang: 'zh' | 'en';
  t: TranslationSet;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<'zh' | 'en'>('zh');

  const toggleLang = () => {
    setLang((prev) => (prev === 'zh' ? 'en' : 'zh'));
  };

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang] as TranslationSet, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
