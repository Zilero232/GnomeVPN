import type { Locale } from '@/shared/i18n';

export type RequestPasswordResetInput = {
  email: string;
  locale: Locale;
};
