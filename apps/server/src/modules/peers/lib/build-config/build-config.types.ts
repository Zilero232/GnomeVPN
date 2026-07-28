import type { TunnelProtocol } from '@gnomevpn/schemas';

export type TunnelNode = {
  host: string;
  port: number;
  serverName: string;
  wgPublicKey: string | null;
};

export type BuildConfigInput = {
  node: TunnelNode;
  protocol: TunnelProtocol;
  auth: string;
  wgPrivateKey?: string;
  wgAssignedIp?: string;
};
