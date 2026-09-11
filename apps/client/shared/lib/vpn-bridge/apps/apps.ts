import type { InstalledApp } from './apps.types';

import { callRust } from '../../ipc';
import { isTauriDesktop } from '../../tauri-platform';

export const listInstalledApps = async (): Promise<InstalledApp[]> => callRust({ command: 'list_installed_apps', fallback: [] });

export const listRunningProcesses = async (): Promise<InstalledApp[]> => callRust({ command: 'list_running_processes', fallback: [] });

export const pickExecutable = async (): Promise<string | null> => {
  if (!isTauriDesktop()) {
    return null;
  }

  const [{ open }, { platform }] = await Promise.all([import('@tauri-apps/plugin-dialog'), import('@tauri-apps/plugin-os')]);

  const current = platform();

  const selected = await open({
    multiple: false,
    directory: current === 'macos',
    ...(current === 'windows' && { filters: [{ name: 'Executable', extensions: ['exe'] }] })
  });

  return typeof selected === 'string' ? selected : null;
};
