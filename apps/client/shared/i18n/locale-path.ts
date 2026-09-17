import type { Locale } from './config';

import { DEFAULT_LOCALE } from './config';

export const localePath = ({ path, locale }: { path: string; locale: Locale }): string => {
  const normalized = path === '/' ? '' : path;

  return locale === DEFAULT_LOCALE ? normalized || '/' : `/${locale}${normalized}`;
};
