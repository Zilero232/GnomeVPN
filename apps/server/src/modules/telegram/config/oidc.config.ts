export const TELEGRAM_OIDC = {
  issuer: 'https://oauth.telegram.org',
  jwksUrl: 'https://oauth.telegram.org/.well-known/jwks.json',
  clockToleranceSeconds: 30
} as const;
