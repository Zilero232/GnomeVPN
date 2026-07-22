import type { PeerKind } from '../../../generated';

export type PeerNode = {
  apiUrl: string;
  apiTokenEnvVar: string;
};

export type PeerRef = {
  id: string;
  nodeId: string;
  userId: string;
  kind: PeerKind;
  name: string | null;
};

export type IssuePeerInput = {
  node: PeerNode;
  userId: string;
  kind: PeerKind;
  name?: string;
};

export type CreatedPeer = {
  xrayUserId: string;
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

export type ReleaseManyResult = {
  released: number;
  kept: number;
};
