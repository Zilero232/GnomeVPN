import type { LocalePathInput } from './locale-path.types';

import { DEFAULT_LOCALE } from '../locale';

export const localePath = ({ path, locale }: LocalePathInput): string => {
  const normalized = path === '/' ? '' : path;

  return locale === DEFAULT_LOCALE ? normalized || '/' : `/${locale}${normalized}`;
};
