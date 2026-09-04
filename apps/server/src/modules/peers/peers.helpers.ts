import type { PeerNameInput } from './lib';
import type { CreatedPeer, PeerWgData } from './peers.service.types';

import { peerClientName } from './lib';

export const peerClientNames = (peer: PeerNameInput): string[] => {
  const current = peerClientName(peer);
  const legacy = peerClientName({ ...peer, protocol: undefined });

  return current === legacy ? [current] : [current, legacy];
};

export const peerWgData = (created: CreatedPeer): PeerWgData => ({
  wgAssignedIp: created.wgAssignedIp ?? null,
  wgPrivateKey: created.wgPrivateKey ?? null
});
