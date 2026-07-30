import { Injectable } from '@nestjs/common';

import type { RevokeConfigInput, SetEnabledAllInput } from '../configs.service.types';

import { PeersService } from '../../peers';

@Injectable()
export class ConfigAccessService {
  constructor(private readonly peers: PeersService) {}

  async revoke({ userId, id }: RevokeConfigInput): Promise<void> {
    const peers = await this.peers.findRefs({ id, userId, kind: 'config' });

    await this.peers.releaseNow(peers);
  }

  async setEnabledAll({ userId, enabled }: SetEnabledAllInput): Promise<void> {
    await this.peers.setEnabled({ where: { userId, kind: 'config' }, enabled });
  }
}
