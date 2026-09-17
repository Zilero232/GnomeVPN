import type { PeerNameInput } from './lib';

import { peerClientName } from './lib';

export const peerClientNames = (peer: PeerNameInput): string[] => {
  const current = peerClientName(peer);
  const legacy = peerClientName({ ...peer, protocol: undefined });

  return current === legacy ? [current] : [current, legacy];
};
