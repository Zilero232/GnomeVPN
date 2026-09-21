export const SCHEDULE = {
  reconcileCron: '*/5 * * * *',
  collectOrphansCron: '17 4 * * 0',
  bootGraceMs: 3 * 60_000
} as const;
