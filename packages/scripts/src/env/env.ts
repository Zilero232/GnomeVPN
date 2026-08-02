import { reporter } from '../reporter';

const log = reporter('env');

export const requireEnv = <const K extends string>(keys: readonly K[]): Record<K, string> => {
  const missing = keys.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    log.fail([`missing: ${missing.join(', ')}`, '  values come from .env and .env.release (run `bun run setup:release`)'].join('\n'));
  }

  return Object.fromEntries(keys.map((key) => [key, process.env[key] ?? ''])) as Record<K, string>;
};
