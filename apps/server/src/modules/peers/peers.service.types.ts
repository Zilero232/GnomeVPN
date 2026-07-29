import type { PeerKind, Prisma, TunnelProtocol } from '../../../generated';

export type PeerNode = {
  apiUrl: string;
  apiTokenEnvVar: string;
  wgPublicKey?: string | null;
};

export type PeerRef = {
  id: string;
  nodeId: string;
  userId: string;
  kind: PeerKind;
  name: string | null;
  protocol: TunnelProtocol;
  nodeCredential: string;
};

export type IssuePeerInput = {
  node: PeerNode;
  nodeId?: string;
  userId: string;
  kind: PeerKind;
  protocol: TunnelProtocol;
  name?: string;
};

export type IssueAndPersistInput = IssuePeerInput & {
  persist: (created: CreatedPeer) => Promise<void>;
};

export type CreatedPeer = {
  nodeCredential: string;
  email: string;
  protocol: TunnelProtocol;
  wgAssignedIp?: string;
  wgPrivateKey?: string;
};

export type CreateWireguardClientInput = {
  node: PeerNode;
  nodeId: string;
  email: string;
};

export type DiscardPeerInput = {
  node: PeerNode;
  email: string;
};

export type FindPeersInput = {
  userId: string;
  kind: PeerKind;
  name?: string;
};

export type SetPeerEnabledInput = {
  where: Prisma.PeerWhereInput;
  enabled: boolean;
};
