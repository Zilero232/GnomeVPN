import type { VpnTraffic } from '@/features/vpn/connect';

export type TunnelStatsProps = {
  traffic: VpnTraffic;
  connectedAt: Date | null;
};
