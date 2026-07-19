import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

import { logger } from '../logger';
import { isTauriDesktop } from '../tauri-platform';

import type { NotifyInput } from './notifications.types';

const NOTIFICATION_GROUP = 'vesper-vpn';
const STATUS_NOTIFICATION_ID = 1;

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
      icon: 'icons/128x128.png',
      sound: tone === 'error' ? 'Notification.Looping.Alarm' : 'Notification.Default',
    });
  } catch (error) {
    logger.warn(`notification failed: ${String(error)}`);
  }
};
