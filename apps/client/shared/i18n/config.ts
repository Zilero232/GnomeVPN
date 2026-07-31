export const LOCALES = ['ru', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English'
};

export const resolveLocale = (value: string | undefined): Locale => (LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE);
