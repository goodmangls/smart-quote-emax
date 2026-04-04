import React, { createContext, useContext, useState } from 'react';
import { Language, translations } from '../i18n/translations';

// Language auto-detection removed — English default for global partners
// Admin can switch via language selector in header

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  // A simple translation function
  t: (key: keyof typeof translations['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smartQuoteLanguage') as Language | null;
    // Guard against stale 'cn'/'ja' values saved before language consolidation
    if (saved === 'en' || saved === 'ko') return saved;
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('smartQuoteLanguage', lang);
  };

  const t = (key: keyof typeof translations['en']): string => {
    const val = translations[language][key];
    if (val != null) return val;
    const fallback = translations['en'][key];
    if (fallback != null) return fallback;
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
