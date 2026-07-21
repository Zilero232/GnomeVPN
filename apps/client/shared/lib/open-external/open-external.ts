import { openUrl } from '@tauri-apps/plugin-opener';

import { logger } from '../logger';
import { isTauriDesktop } from '../tauri-platform';

export const openExternal = async (url: string): Promise<void> => {
  if (!isTauriDesktop()) {
    window.location.href = url;

    return;
  }

  try {
    await openUrl(url);
  } catch (error) {
    logger.error(`openExternal failed: ${String(error)}`);
  }
};
