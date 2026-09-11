'use client';

import type { ReactNode } from 'react';

import { useRouter } from 'next/navigation';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { useCloseOnWindowEvent, useTraySetup } from '@/features/app/system-tray';
import { useConnectToggle, useVpnConnectionContext } from '@/features/vpn/connect';
import { ROUTES } from '@/shared/constants';
import { lastNodeIdSetting, protocolSetting, showMainWindow } from '@/shared/lib';

export const TrayProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();

  const { nodes } = useNodes();
  const { hasAccess } = useSubscriptionStatus();
  const { status, activeNodeId, disconnect } = useVpnConnectionContext();

  const active = nodes.find((node) => node.id === activeNodeId);
  const fallback = nodes.find((node) => node.status !== 'offline');
  const target = active ?? fallback;

  const { toggle } = useConnectToggle({
    hasAccess,
    resolveTarget: async () => {
      const lastNodeId = await lastNodeIdSetting.get();
      const preferred = nodes.find((node) => node.id === lastNodeId && node.status !== 'offline');
      const node = active ?? preferred ?? fallback;

      if (!node) {
        return null;
      }

      return { nodeId: node.id, protocol: await protocolSetting.get(), country: node.country };
    },
    onDenied: async () => {
      await showMainWindow();

      router.push(ROUTES.account);
    },
    onUnavailable: showMainWindow
  });

  const releaseOnQuit = async () => {
    await disconnect({ isAutomatic: true });
  };

  useTraySetup({
    isConnected: status === 'connected',
    country: target?.country ?? '',
    onToggle: toggle,
    onOpenAccount: async () => {
      await showMainWindow();

      router.push(ROUTES.account);
    },
    onBeforeQuit: releaseOnQuit
  });

  useCloseOnWindowEvent({ onBeforeQuit: releaseOnQuit });

  return children;
};
