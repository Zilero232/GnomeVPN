import type { TunnelConfig } from '@gnomevpn/schemas';

export type RenderConfigInput = {
  config: TunnelConfig;
  deviceName: string;
  country: string;
};

export type ConfigFileNameInput = {
  country: string;
  deviceName?: string;
};
