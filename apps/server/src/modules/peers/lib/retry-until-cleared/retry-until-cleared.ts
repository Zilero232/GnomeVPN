import { setTimeout as delay } from 'node:timers/promises';

import type { RetryUntilClearedInput } from './retry-until-cleared.types';

export const retryUntilCleared = async ({
  attempts,
  delayMs,
  run,
}: RetryUntilClearedInput): Promise<number> => {
  let kept = 0;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    kept = (await run()).kept;

    if (kept === 0) {
      return 0;
    }

    if (attempt < attempts) {
      await delay(delayMs * attempt);
    }
  }

  return kept;
};
