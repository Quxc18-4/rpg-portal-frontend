import { createContext, useContext, useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'vi';
  });

  const switchLanguage = useCallback((nextLang) => {
    const normalized = nextLang === 'en' ? 'en' : 'vi';
    localStorage.setItem(STORAGE_KEYS.LANG, normalized);
    setLang(normalized);
  }, []);

  const toggleLanguage = useCallback(() => {
    switchLanguage(lang === 'vi' ? 'en' : 'vi');
  }, [lang, switchLanguage]);

  return (
    <LanguageContext.Provider value={{ lang, switchLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}