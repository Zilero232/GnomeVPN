'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { isTauriDesktop, logger } from '@/shared/lib';
import { buildTrayMenu } from '../../lib/build-tray-menu';
import { setupTray } from '../../lib/setup-tray';

import type { TrayItems } from '../../lib/build-tray-menu';
import type { TrayHandle } from '../../lib/setup-tray';
import type { TraySetupInput } from '../types';

export const useTraySetup = ({ isConnected, country, onToggle, onOpenAccount }: TraySetupInput) => {
  const t = useTranslations('tray');

  const itemsRef = useRef<TrayItems | null>(null);
  const trayRef = useRef<TrayHandle | null>(null);
  const actionsRef = useRef({ onToggle, onOpenAccount });

  actionsRef.current = { onToggle, onOpenAccount };

  // biome-ignore lint/correctness/useExhaustiveDependencies: the tray is created once; labels update through the effect below
  useEffect(() => {
    if (!isTauriDesktop()) {
      return;
    }

    let cancelled = false;

    const create = async () => {
      try {
        const { menu, items } = await buildTrayMenu(
          {
            toggle: t('connect'),
            account: t('account'),
            quit: t('quit'),
          },
          {
            onToggle: () => actionsRef.current.onToggle(),
            onOpenAccount: () => actionsRef.current.onOpenAccount(),
          },
        );

        const tray = await setupTray({ tooltip: t('tooltip'), menu });

        if (cancelled) {
          await tray.dispose();

          return;
        }

        itemsRef.current = items;
        trayRef.current = tray;
      } catch (error) {
        logger.error(`tray setup failed: ${String(error)}`);
      }
    };

    create();

    return () => {
      cancelled = true;
      trayRef.current?.dispose().catch((error) => {
        logger.warn(`tray dispose failed: ${String(error)}`);
      });
    };
  }, []);

  useEffect(() => {
    const items = itemsRef.current;
    const tray = trayRef.current;

    if (!items || !tray) {
      return;
    }

    const statusLine = isConnected ? t('online') : t('offline');
    const tooltip = country ? `GnomeVPN — ${statusLine} · ${country}` : `GnomeVPN — ${statusLine}`;

    const updates = [
      items.toggle.setText(isConnected ? t('disconnect') : t('connect')),
      tray.setTooltip(tooltip),
    ];

    Promise.allSettled(updates).then((results) => {
      for (const result of results) {
        if (result.status === 'rejected') {
          logger.warn(`tray update failed: ${String(result.reason)}`);
        }
      }
    });
  }, [isConnected, country, t]);
};
