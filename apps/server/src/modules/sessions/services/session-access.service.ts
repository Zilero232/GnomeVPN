import { Injectable, Logger } from '@nestjs/common';

import { PeersService } from '../../peers';

import type { PeerRef } from '../../peers';

@Injectable()
export class SessionAccessService {
  private readonly logger = new Logger(SessionAccessService.name);

  constructor(private readonly peers: PeersService) {}

  async releaseAll(peers: PeerRef[]): Promise<void> {
    const { kept } = await this.peers.releaseMany(peers);

    if (kept > 0) {
      this.logger.warn(`Kept ${kept} session row(s): peers still live`);
    }
  }

  async disconnectAll(userId: string): Promise<void> {
    await this.releaseAll(await this.peers.findRefs({ userId, kind: 'session' }));
  }
}
