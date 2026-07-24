import { Injectable, Logger } from '@nestjs/common';

import { PeersService } from '../../peers';

import type { PeerRef } from '../../peers';

@Injectable()
export class SessionAccessService {
  private readonly logger = new Logger(SessionAccessService.name);

  constructor(private readonly peers: PeersService) {}

  async releaseAll(peers: PeerRef[]): Promise<void> {
    if (peers.length === 0) {
      return;
    }

    await this.peers.remove(peers.map((peer) => peer.id));

    void this.peers.releaseMany(peers).catch((error: unknown) => {
      this.logger.warn(`Detached release failed for ${peers.length} peer(s): ${String(error)}`);
    });
  }

  async disconnectAll(userId: string): Promise<void> {
    await this.releaseAll(await this.peers.findRefs({ userId, kind: 'session' }));
  }
}
