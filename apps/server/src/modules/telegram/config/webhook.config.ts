export const WEBHOOK = {
  path: 'telegram/webhook',
  secretHeader: 'x-telegram-bot-api-secret-token',
  httpsPrefix: 'https://',
  trailingSlash: /\/$/u
} as const;
