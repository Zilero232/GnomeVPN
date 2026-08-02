export const LOCALES = ['ru', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ru';

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English'
};

const KNOWN_LOCALES: readonly string[] = LOCALES;

const isLocale = (value: string | undefined): value is Locale => value !== undefined && KNOWN_LOCALES.includes(value);

export const resolveLocale = (value: string | undefined): Locale => (isLocale(value) ? value : DEFAULT_LOCALE);
