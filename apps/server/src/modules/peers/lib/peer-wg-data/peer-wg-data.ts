import type { CreatedPeer } from '../../peers.service.types';
import type { PeerWgData } from './peer-wg-data.types';

export const peerWgData = (created: CreatedPeer): PeerWgData => ({
  wgAssignedIp: created.wgAssignedIp ?? null,
  wgPrivateKey: created.wgPrivateKey ?? null
});
