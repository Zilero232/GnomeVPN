import type { BotLocale } from '../../telegram.types';

export type LinkMessageInput = {
  locale: BotLocale;
  intro: string;
  url: string;
};
