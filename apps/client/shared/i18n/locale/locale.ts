import { isNonNullish } from 'remeda';

import type { Locale } from './locale.types';

import { DEFAULT_LOCALE, LOCALES } from './locale.constants';

const KNOWN_LOCALES: readonly string[] = LOCALES;

const isLocale = (value: string | undefined): value is Locale => isNonNullish(value) && KNOWN_LOCALES.includes(value);

export const resolveLocale = (value: string | undefined): Locale => (isLocale(value) ? value : DEFAULT_LOCALE);
