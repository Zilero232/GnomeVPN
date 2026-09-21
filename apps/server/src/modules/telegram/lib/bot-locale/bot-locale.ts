import type { BotLocale } from '../../telegram.types';

import { RUSSIAN_PREFIX } from './bot-locale.constants';

export const resolveLocale = (raw: string | null | undefined): BotLocale => (raw?.toLowerCase().startsWith(RUSSIAN_PREFIX) ? 'ru' : 'en');
