export const BOT_API = {
  timeoutSeconds: 15,
  initAttempts: 4,
  initBackoffMs: 3_000,
  callRetries: 3,
  callBackoffMs: 1_000
} as const;
