import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu';
import { exit } from '@tauri-apps/plugin-process';

import { logger } from '@/shared/lib';

import type { BuildTrayMenuInput } from './build-tray-menu.types';

import { TRAY_MENU_ID } from '../config/menu-ids';

export const buildTrayMenu = async ({ labels, actions }: BuildTrayMenuInput) => {
  const toggle = await MenuItem.new({
    id: TRAY_MENU_ID.toggle,
    text: labels.toggle,
    action: async () => {
      try {
        await actions.onToggle();
      } catch (error) {
        logger.warn(`tray toggle failed: ${String(error)}`);
      }
    }
  });

  const account = await MenuItem.new({
    id: TRAY_MENU_ID.account,
    text: labels.account,
    action: async () => {
      try {
        await actions.onOpenAccount();
      } catch (error) {
        logger.warn(`tray account failed: ${String(error)}`);
      }
    }
  });

  const quit = await MenuItem.new({
    id: TRAY_MENU_ID.quit,
    text: labels.quit,
    action: async () => {
      try {
        await actions.onBeforeQuit();
      } catch (error) {
        logger.warn(`tray quit cleanup failed: ${String(error)}`);
      }

      try {
        await exit(0);
      } catch (error) {
        logger.warn(`tray quit failed: ${String(error)}`);
      }
    }
  });

  const separator = await PredefinedMenuItem.new({ item: 'Separator' });

  const items = { toggle, account, quit } as const;

  const menu = await Menu.new({ items: [toggle, account, separator, quit] });

  return { menu, items };
};

export type TrayItems = Awaited<ReturnType<typeof buildTrayMenu>>['items'];
