export type PanelCredentials = {
  baseUrl: string;
  token: string;
};

export type EnsureInboundInput = PanelCredentials & {
  inbound: Record<string, unknown>;
};
