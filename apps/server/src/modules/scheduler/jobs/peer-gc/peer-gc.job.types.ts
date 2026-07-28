import type { TunnelProtocol } from '@gnomevpn/schemas';

export type PeerRow = {
  id: string;
  userId: string;
  name: string | null;
  protocol: TunnelProtocol;
  createdAt: Date;
  trafficBytes: bigint;
  lastActiveAt: Date | null;
  node: { apiUrl: string; apiTokenEnvVar: string };
};
