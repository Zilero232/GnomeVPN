import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

import { logger } from '../logger';
import { resolveBundledResource } from '../resource-path';
import { isTauriDesktop } from '../tauri-platform';
import { NOTIFICATION_GROUP, NOTIFICATION_ICON, STATUS_NOTIFICATION_ID } from './config';
import { resolveSound } from './lib';

import type { NotifyInput } from './model';

const ensurePermission = async (): Promise<boolean> => {
  if (await isPermissionGranted()) {
    return true;
  }

  return (await requestPermission()) === 'granted';
};

export const notify = async ({ title, body, tone = 'info' }: NotifyInput): Promise<void> => {
  if (!isTauriDesktop()) {
    return;
  }

  try {
    if (!(await ensurePermission())) {
      return;
    }

    sendNotification({
      id: STATUS_NOTIFICATION_ID,
      title,
      body,
      group: NOTIFICATION_GROUP,
      icon: await resolveBundledResource(NOTIFICATION_ICON),
      sound: resolveSound(tone),
    });
  } catch (error) {
    logger.warn(`notification failed: ${String(error)}`);
  }
};
