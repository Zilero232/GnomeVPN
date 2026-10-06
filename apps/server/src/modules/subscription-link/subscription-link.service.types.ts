import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { DeviceHeaders, DeviceIdentity } from '../devices';
import type { TlsMode } from './lib';

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

export type FeedPeer = {
  protocol: TunnelProtocol;
  nodeCredential: string;
};

export type SubscriptionBody = {
  body: string;
  headers: Record<string, string>;
};

export type BuildFeedInput = {
  token: string;
  headers: DeviceHeaders;
};

export type TouchLinkInput = {
  token: string;
  userAgent: string | null;
};

export type ServerUrisInput = {
  userId: string;
  deviceId: string;
  nodes: SubscriptionNode[];
  tls: TlsMode;
};

export type EnsureNodeInput = {
  userId: string;
  deviceId: string;
  node: SubscriptionNode;
};

export type IssueFeedPeerInput = EnsureNodeInput & {
  protocol: TunnelProtocol;
};

export type ForgetPeersInput = {
  userId: string;
  name: string;
  nodeId: string;
  protocols: TunnelProtocol[];
};

export type PersistPeerInput = {
  userId: string;
  deviceId: string;
  name: string;
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

export type DeviceAddedInput = {
  userId: string;
  identity: DeviceIdentity;
  deviceCount: number;
  deviceLimit: number;
};

export type DeviceBlockedInput = {
  token: string;
  userId: string;
  identity: DeviceIdentity;
  deviceLimit: number;
};
