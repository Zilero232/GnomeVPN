import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { exit } from '@tauri-apps/plugin-process';

import { showMainWindow } from '@/shared/lib';
import { TRAY_MENU_ID } from '../config/menu-ids';

import type { TrayMenuLabels } from '../model/types';

export const buildTrayMenu = async (labels: TrayMenuLabels) => {
  const status = await MenuItem.new({
    id: TRAY_MENU_ID.status,
    text: labels.status,
    enabled: false,
  });

  const show = await MenuItem.new({
    id: TRAY_MENU_ID.show,
    text: labels.show,
    action: async () => {
      await showMainWindow();
    },
  });

  const quit = await MenuItem.new({
    id: TRAY_MENU_ID.quit,
    text: labels.quit,
    action: async () => {
      try {
        await exit(0);
      } catch {}
    },
  });

  const separator = () => PredefinedMenuItem.new({ item: 'Separator' });

  const items = { status, show, quit } as const;

  const menu = await Menu.new({
    items: [status, await separator(), show, await separator(), quit],
  });

  return { menu, items };
};

export type TrayItems = Awaited<ReturnType<typeof buildTrayMenu>>['items'];
