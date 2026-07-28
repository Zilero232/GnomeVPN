import type { VpnTraffic } from '@/shared/lib';

export type UseAdoptTunnelInput = {
  onAdopted: (nodeId: string | null) => void;
  onTraffic: (traffic: VpnTraffic) => void;
  onLost: () => void;
};
