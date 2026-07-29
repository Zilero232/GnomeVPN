'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { isTauriDesktop, logger, settleAll } from '@/shared/lib';

import type { TrayItems } from '../../lib/build-tray-menu';
import type { TrayHandle } from '../../lib/setup-tray';
import type { TraySetupInput } from '../types';

import { buildTrayMenu } from '../../lib/build-tray-menu';
import { setupTray } from '../../lib/setup-tray';

export const useTraySetup = ({
  isConnected,
  country,
  onToggle,
  onOpenAccount,
  onBeforeQuit
}: TraySetupInput) => {
  const t = useTranslations('tray');

  const itemsRef = useRef<TrayItems | null>(null);
  const trayRef = useRef<TrayHandle | null>(null);
  const actionsRef = useRef({ onToggle, onOpenAccount, onBeforeQuit });

  actionsRef.current = { onToggle, onOpenAccount, onBeforeQuit };

  // the tray is created once; labels update through the effect below
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
            quit: t('quit')
          },
          {
            onToggle: () => actionsRef.current.onToggle(),
            onOpenAccount: () => actionsRef.current.onOpenAccount(),
            onBeforeQuit: () => actionsRef.current.onBeforeQuit()
          }
        );

        const tray = await setupTray({ tooltip: t('tooltip'), menu, isConnected });

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

    settleAll({
      label: 'tray update',
      tasks: [
        items.toggle.setText(isConnected ? t('disconnect') : t('connect')),
        tray.setTooltip(tooltip),
        tray.setConnected(isConnected)
      ]
    });
  }, [isConnected, country, t]);
};
