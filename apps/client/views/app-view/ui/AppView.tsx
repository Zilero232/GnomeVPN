'use client';

import { clsx } from 'clsx';
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { useCloseOnWindowEvent, useTraySetup } from '@/features/app/system-tray';
import { ConnectButton, useVpnConnectionContext } from '@/features/vpn/connect';
import { env } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { showMainWindow } from '@/shared/lib';
import { Text } from '@/shared/ui';
import { AppMenu, NodeList, TunnelStats } from './components';

import s from './AppView.module.scss';

export const AppView = () => {
  const t = useTranslations('app');
  const router = useRouter();
  const { nodes, isLoading, isError } = useNodes();
  const { hasAccess } = useSubscriptionStatus();
  const { status, activeNodeId, traffic, connectedAt, connect, disconnect } =
    useVpnConnectionContext();

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

    if (!hasAccess) {
      router.push(ROUTES.account);

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
        await disconnect({ isAutomatic: true });
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

        <div className={s.headRight}>
          <span className={s.version}>v{env.NEXT_PUBLIC_APP_VERSION}</span>

          <Link aria-label={t('openAccount')} className={s.accountLink} href={ROUTES.account}>
            <UserRound size={15} />
          </Link>

          <AppMenu />
        </div>
      </header>

      <div className={s.body}>
        <ConnectButton
          status={status}
          disabled={hasAccess && (!effectiveNodeId || (!canConnect && status === 'disconnected'))}
          onToggle={onToggle}
        />

        {!hasAccess && <Text tone="muted">{t('gateHint')}</Text>}

        {isOnline && <TunnelStats connectedAt={connectedAt} traffic={traffic} />}

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
