'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { useCloseOnWindowEvent, useTraySetup } from '@/features/app/system-tray';
import { ConnectButton, useVpnConnection } from '@/features/vpn/connect';
import { ROUTES } from '@/shared/constants';
import { showMainWindow } from '@/shared/lib';
import { Button, Text } from '@/shared/ui';
import { AppMenu, NodeList } from './components';

import s from './AppView.module.scss';

export const AppView = () => {
  const t = useTranslations('app');
  const router = useRouter();
  const { nodes, isLoading, isError } = useNodes();
  const { hasAccess } = useSubscriptionStatus();
  const { status, activeNodeId, connect, disconnect } = useVpnConnection();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const firstReachableId = nodes.find((node) => node.status !== 'offline')?.id ?? null;
  const effectiveNodeId = activeNodeId ?? selectedNodeId ?? firstReachableId;
  const isOnline = status === 'connected';
  const activeNode = nodes.find((node) => node.id === effectiveNodeId);
  const canConnect = activeNode?.status !== undefined && activeNode.status !== 'offline';

  const onToggle = async () => {
    if (status === 'connected') {
      await disconnect();

      return;
    }

    if (!effectiveNodeId || !canConnect) {
      return;
    }

    await connect(effectiveNodeId, activeNode?.country ?? '');
  };

  useTraySetup({
    isConnected: isOnline,
    country: activeNode?.country ?? '',
    onToggle,
    onOpenAccount: async () => {
      await showMainWindow();
      router.push(ROUTES.account);
    },
  });

  useCloseOnWindowEvent({
    onBeforeQuit: async () => {
      if (status !== 'disconnected') {
        await disconnect();
      }
    },
  });

  return (
    <main className={s.root}>
      <header className={s.head}>
        <span className={clsx(s.status, isOnline ? s.statusOn : s.statusOff)}>
          <span className={s.statusDot} />
          {isOnline ? t('statusOnline') : t('statusOffline')}
        </span>

        <AppMenu />
      </header>

      <div className={s.body}>
        {hasAccess ? (
          <ConnectButton
            status={status}
            disabled={!effectiveNodeId || (!canConnect && status === 'disconnected')}
            onToggle={onToggle}
          />
        ) : (
          <div className={s.gate}>
            <Text tone="muted">{t('gateTitle')}</Text>
            <Link href={ROUTES.account}>
              <Button>{t('gateAction')}</Button>
            </Link>
          </div>
        )}

        <NodeList
          activeNodeId={effectiveNodeId}
          isError={isError}
          isLoading={isLoading}
          isLocked={status !== 'disconnected'}
          nodes={nodes}
          onSelect={setSelectedNodeId}
        />
      </div>
    </main>
  );
};
