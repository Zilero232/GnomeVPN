'use client';

import { useMutation } from '@tanstack/react-query';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';

import { isTauriDesktop } from '@/shared/lib';

export const useCheckUpdate = () => {
  return useMutation({
    mutationFn: async (): Promise<string | null> => {
      if (!isTauriDesktop()) {
        return null;
      }

      const update = await check();

      if (!update) {
        return null;
      }

      await update.downloadAndInstall();
      await relaunch();

      return update.version;
    },
  });
};
