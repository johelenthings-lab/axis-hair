import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import en from "./en.json";
import pt from "./pt.json";

export type Language = "en" | "pt";
type TranslationKey = keyof typeof en;
type Translations = Record<TranslationKey, string>;

const translationMap: Record<Language, Translations> = { en, pt };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem("axis-lang") as Language) || "en",
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("axis-lang", lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translationMap[language][key] ?? key,
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
