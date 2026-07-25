import { setTimeout as delay } from 'node:timers/promises';
import { Injectable, Logger } from '@nestjs/common';

import { PeersService } from '../../peers';
import { RELEASE_RETRIES, RELEASE_RETRY_DELAY_MS } from '../config';

import type { PeerRef } from '../../peers';

@Injectable()
export class SessionAccessService {
  private readonly logger = new Logger(SessionAccessService.name);

  constructor(private readonly peers: PeersService) {}

  private async releaseWithRetry(peers: PeerRef[]): Promise<void> {
    for (let attempt = 1; attempt <= RELEASE_RETRIES; attempt += 1) {
      const { kept } = await this.peers.releaseMany(peers);

      if (kept === 0) {
        return;
      }

      if (attempt < RELEASE_RETRIES) {
        await delay(RELEASE_RETRY_DELAY_MS * attempt);
      }
    }

    this.logger.warn(
      `Could not release ${peers.length} peer(s) on the node after ${RELEASE_RETRIES} attempts`,
    );
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
