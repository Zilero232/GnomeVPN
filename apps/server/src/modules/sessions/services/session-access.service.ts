import { Injectable, Logger } from '@nestjs/common';

import { PEER_RETRY, PeersService, retryUntilCleared } from '../../peers';

import type { PeerRef } from '../../peers';

@Injectable()
export class SessionAccessService {
  private readonly logger = new Logger(SessionAccessService.name);

  constructor(private readonly peers: PeersService) {}

  private async releaseWithRetry(peers: PeerRef[]): Promise<void> {
    const failed = await retryUntilCleared({
      ...PEER_RETRY,
      run: () => this.peers.releaseMany(peers),
    });

    if (failed > 0) {
      this.logger.warn(
        `Could not release ${failed} peer(s) on the node after ${PEER_RETRY.attempts} attempts`,
      );
    }
  }

  async releaseAll(peers: PeerRef[]): Promise<void> {
    if (peers.length === 0) {
      return;
    }

    await this.peers.remove(peers.map((peer) => peer.id));

    void this.releaseWithRetry(peers).catch((error: unknown) => {
      this.logger.warn(`Detached release failed for ${peers.length} peer(s): ${String(error)}`);
    });
  }

  async disconnectAll(userId: string): Promise<void> {
    await this.releaseAll(await this.peers.findRefs({ userId, kind: 'session' }));
  }
}
