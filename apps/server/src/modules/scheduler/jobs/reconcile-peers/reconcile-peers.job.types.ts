import type { PeerKind, PeerState, TunnelProtocol } from '../../../../../generated';
import type { IdentifiedNode } from '../../../../common/lib';

export type ReconcileNode = IdentifiedNode;

export type PeerIdentity = {
  userId: string;
  kind: PeerKind;
  name: string | null;
  nodeId: string;
  protocol: TunnelProtocol;
};

export type ReconcilePeer = PeerIdentity & {
  id: string;
  state: PeerState;
  nodeCredential: string;
};

export type NoteFailureInput = {
  nodeId: string;
  reason: unknown;
};

export type ReconcileNodeInput = {
  node: ReconcileNode;
  withOrphans: boolean;
};
