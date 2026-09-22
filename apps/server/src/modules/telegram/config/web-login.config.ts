export const WEB_LOGIN = {
  bytes: 32,
  ttlMinutes: 10,
  path: '/telegram',
  throttle: { ttl: 60_000, limit: 10 }
} as const;
