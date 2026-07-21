import { TrayIcon } from '@tauri-apps/api/tray';

import { toggleMainWindow } from '@/shared/lib';
import { TRAY_ICON, TRAY_ID } from '../config';

import type { SetupTrayInput } from './setup-tray.types';

const iconFor = (isConnected: boolean): string =>
  isConnected ? TRAY_ICON.connected : TRAY_ICON.disconnected;

export const setupTray = async ({ tooltip, menu, isConnected }: SetupTrayInput) => {
  const existing = await TrayIcon.getById(TRAY_ID);

  if (existing) {
    await existing.close();
  }

  const tray = await TrayIcon.new({
    id: TRAY_ID,
    icon: iconFor(isConnected),
    tooltip,
    menu,
    menuOnLeftClick: false,
    action: async (event) => {
      if (event.type === 'Click' && event.button === 'Left' && event.buttonState === 'Up') {
        await toggleMainWindow();
      }
    },
  });

  return {
    setTooltip: async (value: string) => {
      await tray.setTooltip(value);
    },
    setConnected: async (value: boolean) => {
      await tray.setIcon(iconFor(value));
    },
    dispose: async () => {
      await tray.close();
    },
  };
};

export type TrayHandle = Awaited<ReturnType<typeof setupTray>>;
