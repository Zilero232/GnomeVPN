export const SUBSCRIPTION_POLL = {
  inactiveMs: 3_000,
  activeMs: 60_000,
  errorMs: 5_000,
  maxErrorMs: 60_000,
  retries: 3
} as const;
