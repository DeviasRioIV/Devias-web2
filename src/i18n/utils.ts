import es from "./es.json";
import en from "./en.json";

export const languages = {
  es: "Español",
  en: "English",
} as const;

export const defaultLang = "es";

const dictionaries = { es, en };

export type Lang = keyof typeof dictionaries;

/** Devuelve el diccionario de traducciones para el idioma indicado. */
export function getTranslations(lang: string | undefined) {
  return dictionaries[(lang as Lang) ?? defaultLang] ?? dictionaries[defaultLang];
}
