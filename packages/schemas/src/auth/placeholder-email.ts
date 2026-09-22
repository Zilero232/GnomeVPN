export const PLACEHOLDER_EMAIL = {
  domain: 'placeholder.invalid',
  telegramNamespace: 'telegram'
} as const;

export const telegramPlaceholderEmail = (telegramId: bigint | string): string =>
  `${telegramId}@${PLACEHOLDER_EMAIL.telegramNamespace}.${PLACEHOLDER_EMAIL.domain}`;

export const isPlaceholderEmail = (email: string): boolean => email.toLowerCase().endsWith(`.${PLACEHOLDER_EMAIL.domain}`);
