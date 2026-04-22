import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { ko } from "./resources/ko";
import { en } from "./resources/en";
import { ja } from "./resources/ja";
import { zh } from "./resources/zh";

const resources = { ko, en, ja, zh };

export const SUPPORTED_LANGUAGES = [
  { code: "ko", label: "한국어", short: "KO" },
  { code: "en", label: "English", short: "EN" },
  { code: "ja", label: "日本語", short: "JA" },
  { code: "zh", label: "中文", short: "ZH" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const LANGUAGE_STORAGE_KEY = "app-language";

function readInitial(): LanguageCode {
  if (typeof window === "undefined") return "ko";
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      return stored as LanguageCode;
    }
  } catch {
    /* ignore */
  }
  return "ko";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: readInitial(),
    fallbackLng: "en",
    defaultNS: "common",
    ns: ["common", "nav", "auth", "form"],
    interpolation: { escapeValue: false },
  });
}

export default i18n;
