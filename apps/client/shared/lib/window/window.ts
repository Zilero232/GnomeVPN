import { getCurrentWindow } from '@tauri-apps/api/window';

import type { SafeWindowInput } from './window.types';

import { logger } from '../logger';

const safeWindow = async ({ label, run }: SafeWindowInput) => {
  try {
    await run();
  } catch (error) {
    logger.error(`Window ${label} failed: ${String(error)}`);
  }
};

export const minimizeMainWindow = async (): Promise<void> => {
  await safeWindow({
    label: 'minimize',
    run: async () => {
      await getCurrentWindow().minimize();
    }
  });
};

export const showMainWindow = async (): Promise<void> => {
  await safeWindow({
    label: 'show',
    run: async () => {
      const win = getCurrentWindow();

      await win.unminimize();
      await win.show();
      await win.setFocus();
    }
  });
};

export const hideMainWindow = async (): Promise<void> => {
  await safeWindow({
    label: 'hide',
    run: async () => {
      await getCurrentWindow().hide();
    }
  });
};

export const toggleMainWindow = async (): Promise<void> => {
  await safeWindow({
    label: 'toggle',
    run: async () => {
      const win = getCurrentWindow();

      if (await win.isVisible()) {
        await win.hide();

        return;
      }

      await win.unminimize();
      await win.show();
      await win.setFocus();
    }
  });
};

export const closeMainWindow = async (): Promise<void> => {
  await safeWindow({
    label: 'close',
    run: async () => {
      await getCurrentWindow().close();
    }
  });
};
