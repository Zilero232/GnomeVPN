'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { useCloseOnWindowEvent, useTraySetup } from '@/features/app/system-tray';
import { ConnectButton, useVpnConnection } from '@/features/vpn/connect';
import { ROUTES } from '@/shared/constants';
import { BrandMark, Button, Text } from '@/shared/ui';
import { AppMenu, NodeList } from './components';

import s from './AppView.module.scss';

export const AppView = () => {
  const t = useTranslations('app');
  const { nodes, isLoading, isError } = useNodes();
  const { hasAccess } = useSubscriptionStatus();
  const { status, activeNodeId, connect, disconnect } = useVpnConnection();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const effectiveNodeId = activeNodeId ?? selectedNodeId ?? nodes[0]?.id ?? null;
  const isOnline = status === 'connected';

  useTraySetup(isOnline);
  useCloseOnWindowEvent();

  const onToggle = () => {
    if (status === 'connected') {
      void disconnect();

      return;
    }

    if (effectiveNodeId) {
      const node = nodes.find((item) => item.id === effectiveNodeId);

      void connect(effectiveNodeId, node?.country ?? '');
    }
  };

  return (
    <main className={s.root}>
      <header className={s.head}>
        <BrandMark />

        <div className={s.headRight}>
          <span className={clsx(s.status, isOnline ? s.statusOn : s.statusOff)}>
            <span className={s.statusDot} />
            {isOnline ? t('statusOnline') : t('statusOffline')}
          </span>

          <AppMenu />
        </div>
      </header>

      <div className={s.body}>
        {hasAccess ? (
          <ConnectButton status={status} disabled={!effectiveNodeId} onToggle={onToggle} />
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
