'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { usePlatform } from '@/entities/app/platform';
import { useSubscriptionStatus } from '@/entities/billing/subscription';
import { useNodeLatency, useNodes } from '@/entities/vpn/node';
import { MobileUpdateBanner, UpdateGate } from '@/features/app/check-update';
import { ServiceRepairBanner } from '@/features/app/service-repair';
import { VpnPermissionBanner } from '@/features/app/vpn-permission';
import { ConnectButton, useConnectToggle, useProtocolSelection, useVpnConnectionContext } from '@/features/vpn/connect';
import { SplitTunnelingButton } from '@/features/vpn/split-tunneling';
import { env } from '@/shared/config';
import { ROUTES } from '@/shared/constants';
import { Text } from '@/shared/ui';

import { unavailableHintKey } from '../lib';
import { useNodeSelection } from '../model/hooks';
import { AppMenu, NodePicker, ProtocolSwitch, TunnelStats } from './components';

import s from './AppView.module.scss';

export const AppView = () => {
  const t = useTranslations('app');
  const router = useRouter();
  const { nodes, isLoading, isError } = useNodes();
  const { isDesktopApp } = usePlatform();
  const { hasAccess } = useSubscriptionStatus();

  const { status, activeNodeId, traffic, connectedAt, reconnect } = useVpnConnectionContext();
  const { latency, isMeasuring, remeasure } = useNodeLatency({ isEnabled: hasAccess && status !== 'connected' });
  const selection = useNodeSelection({ nodes, activeNodeId, latency, isMeasuring });
  const { protocol, select: selectProtocol } = useProtocolSelection();

  const { toggle } = useConnectToggle({
    hasAccess,
    resolveTarget: () => (selection.nodeId && selection.isConnectable ? { nodeId: selection.nodeId, protocol, country: selection.country } : null),
    onDenied: () => router.push(ROUTES.account),
    onUnavailable: async () => {
      toast.error(t(unavailableHintKey(selection.reachability)));

      if (selection.reachability === 'unreachable') {
        await remeasure();
      }
    }
  });

  const isOnline = status === 'connected';

  return (
    <main className={s.root}>
      <header className={s.head}>
        {hasAccess ? <ProtocolSwitch isDisabled={status !== 'disconnected'} value={protocol} onChange={selectProtocol} /> : <span />}

        <div className={s.headRight}>
          <Text as='span' className={s.version}>
            v{env.NEXT_PUBLIC_APP_VERSION}
          </Text>

          {isDesktopApp && (
            <SplitTunnelingButton
              hasActiveNode={Boolean(activeNodeId)}
              isConnected={status !== 'disconnected'}
              onReconnect={() => void reconnect()}
            />
          )}

          <AppMenu />
        </div>
      </header>

      <div className={s.body}>
        <ConnectButton disabled={hasAccess && status === 'disconnected' && !selection.isConnectable} status={status} onToggle={toggle} />

        {!hasAccess && <Text tone='muted'>{t('gateHint')}</Text>}

        <NodePicker
          activeNodeId={selection.nodeId}
          isError={isError}
          isLoading={isLoading}
          isLocked={status !== 'disconnected'}
          isMeasuring={isMeasuring}
          latency={latency}
          nodes={nodes}
          onSelect={selection.select}
        />

        <TunnelStats connectedAt={connectedAt} isVisible={isOnline} traffic={traffic} />
      </div>

      <UpdateGate />

      <MobileUpdateBanner />

      <VpnPermissionBanner isConnected={isOnline} />

      <ServiceRepairBanner />
    </main>
  );
};
