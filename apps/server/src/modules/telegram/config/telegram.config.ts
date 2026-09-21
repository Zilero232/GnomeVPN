export const LINK_CODE_LENGTH = 8;

export const LINK_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const LINK_CODE_TTL_MINUTES = 15;

export const WEBHOOK_PATH = 'telegram/webhook';

export const TELEGRAM_SECRET_HEADER = 'x-telegram-bot-api-secret-token';

export const PLAN_CALLBACK_PREFIX = 'plan:';

export const LOCALE_CALLBACK_PREFIX = 'locale:';

export const HTTPS_PREFIX = 'https://';

export const LANGUAGE_BUTTONS = [
  { locale: 'ru', label: 'Русский' },
  { locale: 'en', label: 'English' }
] as const;

export const TRAILING_SLASH = /\/$/u;
