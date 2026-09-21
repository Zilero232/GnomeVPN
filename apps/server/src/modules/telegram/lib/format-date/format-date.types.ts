import type { BotLocale } from '../../telegram.types';

export type FormatDateInput = {
  iso: string | null;
  locale: BotLocale;
};
