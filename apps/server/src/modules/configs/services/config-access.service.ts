import { Injectable } from '@nestjs/common';

import type { RevokeConfigInput, SetEnabledAllInput } from '../configs.service.types';

import { PeersService } from '../../peers';

@Injectable()
export class ConfigAccessService {
  constructor(private readonly peers: PeersService) {}

  async revoke({ userId, id }: RevokeConfigInput): Promise<void> {
    await this.peers.revoke({ id, userId, kind: 'config' });
  }

  async setEnabledAll({ userId, enabled }: SetEnabledAllInput): Promise<void> {
    await this.peers.setEnabled({ where: { userId, kind: 'config' }, enabled });
  }
}
