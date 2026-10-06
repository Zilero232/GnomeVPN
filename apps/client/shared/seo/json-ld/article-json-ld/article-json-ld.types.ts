import type { Locale } from '@/shared/i18n';

export type ArticleJsonLdInput = {
  headline: string;
  description: string;
  path: string;
  locale: Locale;
};
