import type { Locale } from '@/shared/i18n';

export type PageMetadataInput = {
  title: string;
  description: string;
  path?: string;
  locale: Locale;
  index?: boolean;
  follow?: boolean;
};
