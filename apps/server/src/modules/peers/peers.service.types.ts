import type { PeerKind, Prisma, TunnelProtocol } from '../../../generated';
import type { NodeAccess } from '../../common/lib';
import type { XrayClient } from '../../lib/xray';

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
  node: NodeAccess;
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
};

export type DeleteClientInput = {
  client: XrayClient;
  email: string;
};

export type DiscardPeerInput = {
  node: NodeAccess;
  email: string;
};

export type FindPeersInput = {
  id?: string;
  userId: string;
  kind: PeerKind;
  name?: string;
};

export type SetPeerEnabledInput = {
  where: Prisma.PeerWhereInput;
  enabled: boolean;
};

export type ForEachNodeInput<TPeer> = {
  peers: TPeer[];
  run: (input: { client: XrayClient; peers: TPeer[] }) => Promise<void>;
};
