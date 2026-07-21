import { logger } from '../logger';

import type { SettleAllInput } from './settle.types';

export const settleAll = async ({ label, tasks }: SettleAllInput): Promise<void> => {
  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === 'rejected') {
      logger.warn(`${label} failed: ${String(result.reason)}`);
    }
  }
};
