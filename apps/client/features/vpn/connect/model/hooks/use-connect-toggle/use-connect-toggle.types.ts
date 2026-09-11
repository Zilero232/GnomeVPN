import type { TunnelProtocol } from '@gnomevpn/schemas';

export type ConnectTarget = {
  country?: string;
  nodeId: string;
  protocol: TunnelProtocol;
};

export type UseConnectToggleInput = {
  hasAccess: boolean;
  onDenied: () => Promise<void> | void;
  onUnavailable?: () => Promise<void> | void;
  resolveTarget: () => ConnectTarget | Promise<ConnectTarget | null> | null;
};
