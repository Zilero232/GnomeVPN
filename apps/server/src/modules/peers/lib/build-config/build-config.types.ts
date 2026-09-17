import type { TunnelProtocol } from '@gnomevpn/schemas';

export type TunnelNode = {
  host: string;
  port: number;
  serverName: string;
  certFingerprint: string | null;
  realityPublicKey: string | null;
  realityShortId: string | null;
};

export type BuildConfigInput = {
  node: TunnelNode;
  protocol: TunnelProtocol;
  auth: string;
};

export type RealityNode = {
  realityPublicKey: string | null;
  realityShortId: string | null;
};

export type ResolvedRealityNode<T extends RealityNode> = T & {
  realityPublicKey: string;
  realityShortId: string;
};
