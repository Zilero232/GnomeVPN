import { Injectable } from '@nestjs/common';

import type { SetEnabledAllInput } from '../subscription-link.service.types';

import { PeersService } from '../../peers';

@Injectable()
export class SubscriptionAccessService {
  constructor(private readonly peers: PeersService) {}

  async setEnabledAll({ userId, enabled }: SetEnabledAllInput): Promise<void> {
    await this.peers.setEnabled({ where: { userId, kind: 'config' }, enabled });
  }
}
