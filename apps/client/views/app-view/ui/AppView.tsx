'use client';

import { clsx } from 'clsx';
import { UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { useServerEvents } from '@/entities/app/server-events';
import { useCurrentUser } from '@/entities/auth/user';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useDeviceUsage } from '@/entities/vpn/device';
import { useNodeLatency, useNodes } from '@/entities/vpn/node';
import { MobileUpdateBanner, UpdateGate } from '@/features/app/check-update';
import { ServiceRepairBanner } from '@/features/app/service-repair';
import { VpnPermissionBanner } from '@/features/app/vpn-permission';
import { ConnectButton, useVpnConnectionContext } from '@/features/vpn/connect';
import { env } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { Text } from '@/shared/ui';
import { useNodeSelection } from '../model/hooks';
import { AppMenu, NodePicker, TunnelStats } from './components';

import s from './AppView.module.scss';

export const AppView = () => {
  const t = useTranslations('app');
  const router = useRouter();
  const { nodes, isLoading, isError } = useNodes();
  const { isAuthenticated } = useCurrentUser();
  const { hasAccess } = useSubscriptionStatus();

  useServerEvents({ isEnabled: isAuthenticated });
  const { status, activeNodeId, traffic, connectedAt, connect, disconnect } =
    useVpnConnectionContext();

  const selection = useNodeSelection({ nodes, activeNodeId });

  const isOnline = status === 'connected';

  const { latency } = useNodeLatency({ isEnabled: hasAccess && status === 'disconnected' });
  const { usage } = useDeviceUsage({ status });

  const isDeviceLimitReached =
    usage !== null &&
    usage.used >= usage.limit &&
    !usage.devices.some((device) => device.isCurrent);

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
        <ConnectButton
          status={status}
          disabled={
            hasAccess &&
            (!selection.nodeId || (!selection.isReachable && status === 'disconnected'))
          }
          onToggle={onToggle}
        />

        {!hasAccess && <Text tone="muted">{t('gateHint')}</Text>}

        <NodePicker
          activeNodeId={selection.nodeId}
          isError={isError}
          isLoading={isLoading}
          isLocked={status !== 'disconnected'}
          latency={latency}
          nodes={nodes}
          onSelect={selection.select}
        />

        {hasAccess && usage && (
          <Text size="xs" tone={isDeviceLimitReached ? 'danger' : 'muted'}>
            {isDeviceLimitReached
              ? t('devicesFull', { limit: usage.limit })
              : t('devicesUsed', { used: usage.used, limit: usage.limit })}
          </Text>
        )}

        <TunnelStats connectedAt={connectedAt} isVisible={isOnline} traffic={traffic} />
      </div>

      <UpdateGate />

      <MobileUpdateBanner />

      <VpnPermissionBanner isConnected={isOnline} />

      <ServiceRepairBanner />
    </main>
  );
};
