export { PEER_RETRY } from './config';
export {
  buildTunnelConfig,
  PEER_REF_SELECT,
  peerClientName,
  peerWgData,
  retryUntilCleared,
} from './lib';
export { PeersModule } from './peers.module';
export { PeersService } from './services';

export type { TunnelNode } from './lib';
export type { PeerRef } from './peers.service.types';
