export type RetryUntilClearedInput = {
  attempts: number;
  delayMs: number;
  run: () => Promise<{ failed: number }>;
};
