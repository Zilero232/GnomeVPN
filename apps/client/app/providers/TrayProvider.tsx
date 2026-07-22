'use client';

import { useRouter } from 'next/navigation';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { useCloseOnWindowEvent, useTraySetup } from '@/features/app/system-tray';
import { useVpnConnectionContext } from '@/features/vpn/connect';
import { ROUTES } from '@/shared/constants';
import { showMainWindow } from '@/shared/lib';

import type { ReactNode } from 'react';

export const TrayProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const { nodes } = useNodes();
  const { hasAccess } = useSubscriptionStatus();
  const { status, activeNodeId, connect, disconnect } = useVpnConnectionContext();

  const active = nodes.find((node) => node.id === activeNodeId);
  const fallback = nodes.find((node) => node.status !== 'offline');
  const target = active ?? fallback;

  const onToggle = async () => {
    if (status === 'connected') {
      return await disconnect();
    }

    if (!hasAccess) {
      await showMainWindow();

      return router.push(ROUTES.account);
    }

    if (!target) {
      await showMainWindow();

      return;
    }

    await connect({ nodeId: target.id, country: target.country });
  };

  const releaseOnQuit = async () => {
    await disconnect({ isAutomatic: true });
  };

  useTraySetup({
    isConnected: status === 'connected',
    country: target?.country ?? '',
    onToggle,
    onOpenAccount: async () => {
      await showMainWindow();

      router.push(ROUTES.account);
    },
    onBeforeQuit: releaseOnQuit,
  });

  useCloseOnWindowEvent({ onBeforeQuit: releaseOnQuit });

  return children;
};
