import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { Peer } from '../../../generated';

export type SubscriptionNode = {
  id: string;
  country: string;
  countryCode: string;
  city: string | null;
  host: string;
  port: number;
  serverName: string;
  apiUrl: string;
  apiTokenEnvVar: string;
  wgPublicKey: string | null;
  realityPublicKey: string | null;
  realityShortId: string | null;
};

export type SubscriptionBody = {
  body: string;
  headers: Record<string, string>;
};

export type TouchLinkInput = {
  token: string;
  platform: string | null;
};

export type EnsurePeerInput = {
  userId: string;
  node: SubscriptionNode;
  protocol: TunnelProtocol;
};

export type ServerUrisInput = {
  userId: string;
  nodes: SubscriptionNode[];
};

export type PersistSubscriptionPeerInput = {
  userId: string;
  nodeId: string;
  protocol: TunnelProtocol;
  nodeCredential: string;
};

export type SubscriptionPeer = Pick<Peer, 'nodeCredential' | 'nodeId'>;

export type BuildFeedInput = {
  token: string;
  userAgent: string | null;
};

export type SetEnabledAllInput = {
  userId: string;
  enabled: boolean;
};
