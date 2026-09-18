import type { TunnelProtocol } from '@gnomevpn/schemas';

export type SubscriptionNode = {
  id: string;
  country: string;
  countryCode: string;
  city: string | null;
  host: string;
  port: number;
  serverName: string;
  certFingerprint: string | null;
  apiUrl: string;
  apiTokenEnvVar: string;
  realityPublicKey: string | null;
  realityShortId: string | null;
  createdAt: Date;
  lastHealthyAt: Date | null;
};

export type SubscriptionPeer = {
  nodeCredential: string;
};

export type FeedTarget = {
  node: SubscriptionNode;
  protocol: TunnelProtocol;
};

export type SubscriptionBody = {
  body: string;
  headers: Record<string, string>;
};

export type BuildFeedInput = {
  token: string;
  userAgent: string | null;
};

export type TouchLinkInput = BuildFeedInput;

export type ServerUrisInput = {
  userId: string;
  nodes: SubscriptionNode[];
  limitIp: number;
};

export type EnsurePeerInput = {
  userId: string;
  node: SubscriptionNode;
  protocol: TunnelProtocol;
  limitIp: number;
};

export type PersistPeerInput = {
  userId: string;
  nodeId: string;
  protocol: TunnelProtocol;
  nodeCredential: string;
};

export type NodeTrafficInput = {
  userId: string;
  nodes: SubscriptionNode[];
};

export type OneNodeTrafficInput = {
  node: SubscriptionNode;
  emails: Set<string>;
};

export type SetEnabledAllInput = {
  userId: string;
  enabled: boolean;
};

export type UpsertLinkInput = {
  userId: string;
  replaceToken: boolean;
};

export type PresentLinkInput = {
  token: string;
  createdAt: Date;
};
