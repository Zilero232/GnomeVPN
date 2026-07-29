import type { VpnTraffic } from '@/shared/lib';

import type { VpnConnectionStatus } from '../use-vpn-connection/use-vpn-connection.types';

export type UseTrafficPollInput = {
  status: VpnConnectionStatus;
  onTraffic: (traffic: VpnTraffic) => void;
  onLost: () => void;
};
