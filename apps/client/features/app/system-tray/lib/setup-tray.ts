import { TrayIcon } from '@tauri-apps/api/tray';

import { logger, resolveBundledResource, toggleMainWindow } from '@/shared/lib';

import type { SetupTrayInput } from './setup-tray.types';

import { TRAY_ICON, TRAY_ID } from '../config';

const iconFor = async (isConnected: boolean): Promise<string> =>
  resolveBundledResource(isConnected ? TRAY_ICON.connected : TRAY_ICON.disconnected);

const dropExisting = async () => {
  try {
    const existing = await TrayIcon.getById(TRAY_ID);

    await existing?.close();
  } catch (error) {
    logger.warn(`stale tray icon could not be closed: ${String(error)}`);
  }
};

export const setupTray = async ({ tooltip, menu, isConnected }: SetupTrayInput) => {
  await dropExisting();

  const tray = await TrayIcon.new({
    id: TRAY_ID,
    icon: await iconFor(isConnected),
    tooltip,
    menu,
    menuOnLeftClick: false,
    action: async (event) => {
      if (event.type === 'Click' && event.button === 'Left' && event.buttonState === 'Up') {
        await toggleMainWindow();
      }
    }
  });

  return {
    setTooltip: async (value: string) => {
      await tray.setTooltip(value);
    },
    setConnected: async (value: boolean) => {
      await tray.setIcon(await iconFor(value));
    },
    dispose: async () => {
      await tray.close();
    }
  };
};

export type TrayHandle = Awaited<ReturnType<typeof setupTray>>;
