'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { isTauriDesktop, logger } from '@/shared/lib';
import { buildTrayMenu } from '../../lib/build-tray-menu';
import { setupTray } from '../../lib/setup-tray';

import type { TrayItems } from '../../lib/build-tray-menu';

export const useTraySetup = (isConnected: boolean) => {
  const t = useTranslations('tray');

  const itemsRef = useRef<TrayItems | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the tray is created once; label updates go through the effect below
  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    let cancelled = false;
    let dispose: (() => Promise<void>) | null = null;

    const create = async () => {
      try {
        const { menu, items } = await buildTrayMenu({
          status: t('offline'),
          show: t('show'),
          quit: t('quit'),
        });

        const tray = await setupTray({ tooltip: t('tooltip'), menu });

        if (cancelled) {
          await tray.dispose();

          return;
        }

        itemsRef.current = items;
        dispose = tray.dispose;
      } catch (error) {
        logger.error(`tray setup failed: ${String(error)}`);
      }
    };

    void create();

    return () => {
      cancelled = true;
      void dispose?.();
    };
  }, []);

  useEffect(() => {
    const items = itemsRef.current;

    if (!items) {
      return;
    }

    void items.status.setText(isConnected ? t('online') : t('offline')).catch(() => undefined);
  }, [isConnected, t]);
};
