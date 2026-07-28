export type RetryUntilClearedInput = {
  attempts: number;
  delayMs: number;
  run: () => Promise<{ kept: number }>;
};
