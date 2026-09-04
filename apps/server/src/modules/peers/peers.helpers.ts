import type { CreatedPeer, PeerWgData } from './peers.service.types';

export const peerWgData = (created: CreatedPeer): PeerWgData => ({
  wgAssignedIp: created.wgAssignedIp ?? null,
  wgPrivateKey: created.wgPrivateKey ?? null
});
