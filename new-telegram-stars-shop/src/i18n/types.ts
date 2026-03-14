export const LOCALES = ["en", "ru"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LANGUAGE_COOKIE = "site-language";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ru";
}
