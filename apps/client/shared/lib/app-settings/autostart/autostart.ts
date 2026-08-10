import { isTauri } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';

import { logger } from '../../logger';
import { autoStartInitializedSetting } from '../settings';

export const isAutoStartEnabled = async (): Promise<boolean> => {
  if (!isTauri()) {
    return false;
  }

  try {
    return await isEnabled();
  } catch (error) {
    logger.warn(`autostart check failed: ${String(error)}`);

    return false;
  }
};

export const setAutoStart = async (value: boolean): Promise<void> => {
  if (!isTauri()) {
    return;
  }

  try {
    await (value ? enable() : disable());
  } catch (error) {
    logger.error(`autostart ${value ? 'enable' : 'disable'} failed: ${String(error)}`);
  }
};

export const initAutoStartDefault = async (): Promise<void> => {
  if (!isTauri()) {
    return;
  }

  if (await autoStartInitializedSetting.get()) {
    return;
  }

  await setAutoStart(true);
  await autoStartInitializedSetting.set(true);
};
