export const locales = {
  en: { code: 'en', label: 'English', direction: 'ltr' },
  'ti-ER': { code: 'ti-ER', label: 'Eritrean Tigrinya', direction: 'ltr' },
  'he-IL': { code: 'he-IL', label: 'Hebrew', direction: 'rtl' },
} as const;

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'en';

export function textDirection(locale: Locale) {
  return locales[locale].direction;
}
