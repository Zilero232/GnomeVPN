import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';

import { isServer } from '../env';
import { logger } from '../logger';

export const openExternal = async (url: string): Promise<void> => {
  if (isServer()) {
    return;
  }

  if (!isTauri()) {
    window.open(url, '_blank', 'noopener,noreferrer');

    return;
  }

  try {
    await openUrl(url);
  } catch (error) {
    logger.error(`openExternal failed: ${String(error)}`);

    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
