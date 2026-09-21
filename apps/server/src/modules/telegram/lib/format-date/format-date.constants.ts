import { enGB, ru } from 'date-fns/locale';

import type { BotLocale } from '../../telegram.types';

export const DATE_FORMAT = 'd MMMM yyyy';

export const DATE_LOCALES: Record<BotLocale, typeof ru> = { ru, en: enGB };
