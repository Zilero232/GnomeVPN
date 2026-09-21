import type { BotLinkInput } from './bot-link.types';

import { TELEGRAM } from './bot-link.constants';

const handleOf = (bot: string): string => (bot.startsWith(TELEGRAM.atSign) ? bot.slice(TELEGRAM.atSign.length) : bot);

export const botLink = ({ bot, code }: BotLinkInput): string => {
  const base = `${TELEGRAM.base}/${encodeURIComponent(handleOf(bot))}`;

  return code ? `${base}?start=${encodeURIComponent(code)}` : base;
};
