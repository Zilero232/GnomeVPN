import type { TunnelConfig, TunnelProtocol } from '@gnomevpn/schemas';

export type RenderConfigInput = {
  config: TunnelConfig;
  protocol: TunnelProtocol;
  country: string;
  deviceName: string;
};

export type RenderedConfig = {
  fileName: string;
  content: string;
};
