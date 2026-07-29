import type { SettleAllInput } from './settle.types';

import { logger } from '../logger';

export const settleAll = async ({ label, tasks }: SettleAllInput): Promise<void> => {
  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === 'rejected') {
      logger.warn(`${label} failed: ${String(result.reason)}`);
    }
  }
};
