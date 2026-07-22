'use client';

import { clsx } from 'clsx';
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodes } from '@/entities/vpn/node';
import { UpdateGate } from '@/features/app/check-update';
import { ServiceRepairBanner } from '@/features/app/service-repair';
import { ConnectButton, useVpnConnectionContext } from '@/features/vpn/connect';
import { env } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { Text } from '@/shared/ui';
import { useNodeSelection } from '../model/hooks';
import { AppMenu, NodeList, TunnelStats } from './components';

import s from './AppView.module.scss';

export const AppView = () => {
  const t = useTranslations('app');
  const router = useRouter();
  const { nodes, isLoading, isError } = useNodes();
  const { hasAccess } = useSubscriptionStatus();
  const { status, activeNodeId, traffic, connectedAt, connect, disconnect } =
    useVpnConnectionContext();

  const selection = useNodeSelection({ nodes, activeNodeId });

  const isOnline = status === 'connected';

  const onToggle = async () => {
    if (status === 'connected') {
      await disconnect();

      return;
    }

    if (!hasAccess) {
      router.push(ROUTES.account);

      return;
    }

    if (!selection.nodeId || !selection.isReachable) {
      return;
    }

    await connect({ nodeId: selection.nodeId, country: selection.country });
  };

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
        <ServiceRepairBanner />

        <ConnectButton
          status={status}
          disabled={
            hasAccess &&
            (!selection.nodeId || (!selection.isReachable && status === 'disconnected'))
          }
          onToggle={onToggle}
        />

        {!hasAccess && <Text tone="muted">{t('gateHint')}</Text>}

        {isOnline && <TunnelStats connectedAt={connectedAt} traffic={traffic} />}

        <NodeList
          activeNodeId={selection.nodeId}
          isError={isError}
          isLoading={isLoading}
          isLocked={status !== 'disconnected'}
          nodes={nodes}
          onSelect={selection.select}
        />
      </div>

      <UpdateGate />
    </main>
  );
};
