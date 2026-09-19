import { SITE } from '@/shared/config';
import { DEFAULT_LOCALE, localePath, LOCALES } from '@/shared/i18n';

import { X_DEFAULT } from './site-metadata.constants';

export const absoluteUrl = (path: string): string => new URL(path, SITE.url).toString();

export const languageAlternates = (path: string): Record<string, string> =>
  Object.fromEntries([...LOCALES.map((locale) => [locale, localePath({ path, locale })]), [X_DEFAULT, localePath({ path, locale: DEFAULT_LOCALE })]]);
