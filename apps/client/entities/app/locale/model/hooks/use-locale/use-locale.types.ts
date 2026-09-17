import type { Locale } from '@/shared/i18n';

export type UseLocale = {
  locale: Locale;
  isPending: boolean;
  setLocale: (locale: Locale) => void;
};
