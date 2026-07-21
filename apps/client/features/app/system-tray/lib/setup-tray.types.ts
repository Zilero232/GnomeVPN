import type { Menu } from '@tauri-apps/api/menu';

export type SetupTrayInput = {
  tooltip: string;
  menu: Menu;
  isConnected: boolean;
};
