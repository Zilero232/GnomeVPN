import { Injectable, Logger } from '@nestjs/common';

import { AppServiceUnavailableException } from '../../../common/exceptions';
import { PrismaService } from '../../../core';
import { PEER_REF_SELECT, PEER_RETRY, PeersService, retryUntilCleared } from '../../peers';

import type { RevokeConfigInput } from '../configs.service.types';

@Injectable()
export class ConfigAccessService {
  private readonly logger = new Logger(ConfigAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly peers: PeersService,
  ) {}

  async revoke({ userId, id }: RevokeConfigInput): Promise<void> {
    const [existing] = await this.prisma.peer.findMany({
      where: { id, userId, kind: 'config' },
      select: PEER_REF_SELECT,
    });

    if (!existing) {
      return;
    }

    if (!(await this.peers.release(existing))) {
      throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'Could not revoke the peer');
    }

    await this.peers.remove([existing.id]);
  }

  async revokeAll(userId: string): Promise<void> {
    const rows = await this.peers.findRefs({ userId, kind: 'config' });
    const { failed } = await this.peers.releaseMany(rows);

    if (failed > 0) {
      this.logger.warn(`Kept ${failed} config row(s) for ${userId}: peers still live`);
    }
  }

  async setEnabledAll(userId: string, enabled: boolean): Promise<void> {
    const rows = await this.peers.findRefs({ userId, kind: 'config' });

    const failed = await retryUntilCleared({
      ...PEER_RETRY,
      run: () => this.peers.setEnabledMany(rows, enabled),
    });

    if (failed > 0) {
      this.logger.warn(
        `Could not toggle ${failed} config peer(s) after ${PEER_RETRY.attempts} tries`,
      );
    }
  }
}
