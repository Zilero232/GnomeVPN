import type { BotLinkInput } from './TelegramCode.types';

import { AT_SIGN, TELEGRAM_BASE } from './TelegramCode.constants';

export const botLink = ({ bot, code }: BotLinkInput): string => {
  const handle = bot.startsWith(AT_SIGN) ? bot.slice(AT_SIGN.length) : bot;

  return `${TELEGRAM_BASE}/${encodeURIComponent(handle)}?start=${encodeURIComponent(code)}`;
};
