import type { TunnelConfig, TunnelProtocol } from '@gnomevpn/schemas';

export type ConfigFile = {
  fileName: string;
  content: string;
};

export type ConfigContentInput = {
  config: TunnelConfig;
  deviceName: string;
  country: string;
  protocol: TunnelProtocol;
};

export type ConfigFileNameInput = {
  country: string;
  name: string;
  protocol: TunnelProtocol;
};

export type IssueConfigInput = {
  userId: string;
  nodeId: string;
  name: string;
  protocol: TunnelProtocol;
};

export type RevokeConfigInput = {
  userId: string;
  id: string;
};
