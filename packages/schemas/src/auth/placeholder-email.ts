export const PLACEHOLDER_EMAIL = {
  domain: 'placeholder.invalid',
  telegramNamespace: 'telegram'
} as const;

export const telegramPlaceholderEmail = (telegramId: bigint | string): string =>
  `${telegramId}@${PLACEHOLDER_EMAIL.telegramNamespace}.${PLACEHOLDER_EMAIL.domain}`;

export const isPlaceholderEmail = (email: string): boolean => {
  const domain = email.toLowerCase().split('@').at(-1) ?? '';

  return domain === PLACEHOLDER_EMAIL.domain || domain.endsWith(`.${PLACEHOLDER_EMAIL.domain}`);
};
