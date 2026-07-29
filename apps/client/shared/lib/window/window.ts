import { getCurrentWindow } from '@tauri-apps/api/window';

import { logger } from '../logger';

const safeWindow = async (label: string, fn: () => Promise<void>) => {
  try {
    await fn();
  } catch (error) {
    logger.error(`Window ${label} failed: ${String(error)}`);
  }
};

export const minimizeMainWindow = async (): Promise<void> => {
  await safeWindow('minimize', async () => {
    await getCurrentWindow().minimize();
  });
};

export const showMainWindow = async (): Promise<void> => {
  await safeWindow('show', async () => {
    const win = getCurrentWindow();

    await win.unminimize();
    await win.show();
    await win.setFocus();
  });
};

export const hideMainWindow = async (): Promise<void> => {
  await safeWindow('hide', async () => {
    await getCurrentWindow().hide();
  });
};

export const toggleMainWindow = async (): Promise<void> => {
  await safeWindow('toggle', async () => {
    const win = getCurrentWindow();

    if (await win.isVisible()) {
      await win.hide();

      return;
    }

    await win.unminimize();
    await win.show();
    await win.setFocus();
  });
};

export const closeMainWindow = async (): Promise<void> => {
  await safeWindow('close', async () => {
    await getCurrentWindow().close();
  });
};
