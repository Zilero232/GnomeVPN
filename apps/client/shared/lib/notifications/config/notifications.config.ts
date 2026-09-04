import type { NotifyTone } from '../model/types';

export const NOTIFICATION_GROUP = 'gnomevpn';
export const STATUS_NOTIFICATION_ID = 1;
export const NOTIFICATION_ICON = 'icons/128x128.png';

export const WINDOWS_SOUND: Record<NotifyTone, string> = {
  info: 'Default',
  success: 'Default',
  error: 'Reminder'
};

export const MACOS_SOUND: Record<NotifyTone, string> = {
  info: 'Ping',
  success: 'Glass',
  error: 'Basso'
};

export const LINUX_SOUND: Record<NotifyTone, string> = {
  info: 'message-new-instant',
  success: 'complete',
  error: 'dialog-warning'
};
