import type { PeerKind, PeerState, TunnelProtocol } from '../../../../../generated';
import type { XrayClient } from '../../../../lib';

export type ReconcileNode = {
  id: string;
  apiUrl: string;
  apiTokenEnvVar: string;
};

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
};

export type RemoveRevokedInput = {
  xray: XrayClient;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
};

export type SyncEnabledInput = RemoveRevokedInput;

export type CollectOrphansInput = {
  xray: XrayClient;
  nodeId: string;
  peers: ReconcilePeer[];
  nodeClients: Map<string, boolean>;
  online: Set<string> | null;
};

export type NoteFailureInput = {
  nodeId: string;
  reason: unknown;
};
