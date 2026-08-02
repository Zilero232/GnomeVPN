import type { WireguardInboundInput } from '../../../apps/server/src/lib/xray';

export type PanelCredentials = {
  baseUrl: string;
  token: string;
};

export type EnsureInboundInput = PanelCredentials & {
  inbound: Record<string, unknown>;
};

export type EnsureWireguardInboundInput = PanelCredentials & {
  inbound: WireguardInboundInput;
};
