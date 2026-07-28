import type { TunnelConfig, TunnelProtocol } from '@gnomevpn/schemas';

export type RenderConfigInput = {
  config: TunnelConfig;
  deviceName: string;
  country: string;
};

export type ConfigFileNameInput = {
  countryCode: string;
  protocol: TunnelProtocol;
  deviceName?: string;
};
