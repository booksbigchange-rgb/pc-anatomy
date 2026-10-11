export const locales = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    direction: 'ltr',
  },
  'ti-ER': {
    code: 'ti-ER',
    label: 'Eritrean Tigrinya',
    nativeLabel: 'ትግርኛ',
    direction: 'ltr',
  },
  'he-IL': {
    code: 'he-IL',
    label: 'Hebrew',
    nativeLabel: 'עברית',
    direction: 'rtl',
  },
} as const;

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return value in locales;
}

export function textDirection(locale: Locale) {
  return locales[locale].direction;
}
