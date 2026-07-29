import { Injectable } from '@nestjs/common';

import type { PeerRef } from '../../peers';

import { PeersService } from '../../peers';

@Injectable()
export class SessionAccessService {
  constructor(private readonly peers: PeersService) {}

  async releaseAll(peers: PeerRef[]): Promise<void> {
    await this.peers.releaseNow(peers);
  }

  async disconnectAll(userId: string): Promise<void> {
    await this.peers.revoke({ userId, kind: 'session' });
  }
}
