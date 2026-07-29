'use client';

import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEffect, useRef } from 'react';

import { hideMainWindow, isTauriDesktop, logger } from '@/shared/lib';

import { useCloseToTray } from './use-close-to-tray';

type CloseOnWindowEventInput = {
  onBeforeQuit?: () => Promise<void>;
};

export const useCloseOnWindowEvent = ({ onBeforeQuit }: CloseOnWindowEventInput = {}) => {
  const { closeToTray } = useCloseToTray();

  const closeToTrayRef = useRef(closeToTray);
  const beforeQuitRef = useRef(onBeforeQuit);

  closeToTrayRef.current = closeToTray;
  beforeQuitRef.current = onBeforeQuit;

  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    let cancelled = false;
    let unlisten: (() => void) | null = null;

    const subscribe = async () => {
      try {
        const off = await getCurrentWindow().onCloseRequested(async (event) => {
          if (closeToTrayRef.current) {
            event.preventDefault();

            await hideMainWindow();

            return;
          }

          try {
            await beforeQuitRef.current?.();
          } catch (error) {
            logger.warn(`cleanup before quit failed: ${String(error)}`);
          }
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

    subscribe();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
};
