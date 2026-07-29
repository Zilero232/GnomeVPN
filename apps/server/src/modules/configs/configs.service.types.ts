import type { TunnelProtocol } from '@gnomevpn/schemas';

import type { Peer } from '../../../generated';
import type { CreatedPeer } from '../peers';

export type ConfigFile = {
  fileName: string;
  content: string;
};

export type ConfigNode = {
  country: string;
  host: string;
  port: number;
  serverName: string;
  wgPublicKey: string | null;
};

export type ConfigPeerKey = {
  userId: string;
  nodeId: string;
  name: string;
  protocol: TunnelProtocol;
};

export type RebuildWireguardInput = {
  node: ConfigNode;
  name: string;
  peer: Peer;
};

export type PersistConfigPeerInput = ConfigPeerKey & {
  configLimit: number;
  peer: CreatedPeer;
};

export type BuildConfigFileInput = {
  node: ConfigNode;
  name: string;
  protocol: TunnelProtocol;
  auth: string;
  wgPrivateKey?: string;
  wgAssignedIp?: string;
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

export type SetEnabledAllInput = {
  userId: string;
  enabled: boolean;
};
