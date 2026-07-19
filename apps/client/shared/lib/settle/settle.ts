import { logger } from '../logger';

export const settleAll = async (label: string, tasks: Promise<unknown>[]): Promise<void> => {
  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === 'rejected') {
      logger.warn(`${label} failed: ${String(result.reason)}`);
    }
  }
};
