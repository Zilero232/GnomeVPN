'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useRef } from 'react';

import { hideMainWindow, isTauriDesktop, logger } from '@/shared/lib';
import { useCloseToTray } from './use-close-to-tray';

export const useCloseOnWindowEvent = () => {
  const { closeToTray } = useCloseToTray();

  const closeToTrayRef = useRef(closeToTray);

  closeToTrayRef.current = closeToTray;

  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    let cancelled = false;
    let unlisten: (() => void) | null = null;

    const subscribe = async () => {
      try {
        const off = await getCurrentWindow().onCloseRequested((event) => {
          if (!closeToTrayRef.current) {
            return;
          }

          event.preventDefault();
          void hideMainWindow();
        });

        if (cancelled) {
          off();
        } else {
          unlisten = off;
        }
      } catch (error) {
        logger.error(`failed to subscribe to onCloseRequested: ${String(error)}`);
      }
    };

    void subscribe();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
};
