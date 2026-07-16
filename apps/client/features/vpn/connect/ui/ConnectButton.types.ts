import type { VpnConnectionStatus } from '../model/hooks/use-vpn-connection';

export type ConnectButtonProps = {
  status: VpnConnectionStatus;
  disabled?: boolean;
  onToggle: () => void;
};
