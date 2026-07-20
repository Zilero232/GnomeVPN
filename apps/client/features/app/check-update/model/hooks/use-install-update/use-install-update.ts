'use client';

import { useMutation } from '@tanstack/react-query';
import { relaunch } from '@tauri-apps/plugin-process';
import { check } from '@tauri-apps/plugin-updater';
import { useState } from 'react';
import { match } from 'ts-pattern';

import { isTauriDesktop } from '@/shared/lib';

import type { UpdateProgress } from './use-install-update.types';

const INITIAL_PROGRESS: UpdateProgress = { downloadedBytes: 0, totalBytes: null };

export const useInstallUpdate = () => {
  const [progress, setProgress] = useState<UpdateProgress>(INITIAL_PROGRESS);

  const mutation = useMutation({
    mutationFn: async (): Promise<void> => {
      if (!isTauriDesktop()) {
        return;
      }

      setProgress(INITIAL_PROGRESS);

      const update = await check();

      if (!update) {
        return;
      }

      await update.downloadAndInstall((event) => {
        match(event)
          .with({ event: 'Started' }, ({ data }) =>
            setProgress({ downloadedBytes: 0, totalBytes: data.contentLength ?? null }),
          )
          .with({ event: 'Progress' }, ({ data }) =>
            setProgress((current) => ({
              ...current,
              downloadedBytes: current.downloadedBytes + data.chunkLength,
            })),
          )
          .with({ event: 'Finished' }, () =>
            setProgress((current) => ({
              ...current,
              downloadedBytes: current.totalBytes ?? current.downloadedBytes,
            })),
          )
          .exhaustive();
      });

      await relaunch();
    },
  });

  return { ...mutation, progress };
};
