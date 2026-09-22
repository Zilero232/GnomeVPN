import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../core';
import { PEER_REF_SELECT, PeersService } from '../../peers';
import { IdentityService } from './identity.service';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly peers: PeersService,
    private readonly identity: IdentityService
  ) {}

  async remove(userId: string): Promise<void> {
    const peers = await this.prisma.peer.findMany({ where: { userId }, select: PEER_REF_SELECT });

    await this.peers.releaseDetached(peers);

    await this.identity.deleteUser(userId);

    this.logger.log(`account ${userId} removed with ${peers.length} peers`);
  }
}
