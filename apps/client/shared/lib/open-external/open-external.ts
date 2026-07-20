import { openUrl } from '@tauri-apps/plugin-opener';

import { logger } from '../logger';
import { isTauriDesktop } from '../tauri-platform';

/**
 * Sends a URL to the user's default browser on desktop, and navigates there in
 * a plain browser. The desktop app has a single chromeless webview: assigning
 * window.location would carry it off to a third-party origin with no way back,
 * which is what froze the window after a YooKassa checkout.
 */
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
