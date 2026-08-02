import type { VpnConnectionStatus } from '../use-vpn-connection';

export type UseAdoptTunnelInput = {
  status: VpnConnectionStatus;
  onAdopted: (nodeId: string | null) => void;
};
