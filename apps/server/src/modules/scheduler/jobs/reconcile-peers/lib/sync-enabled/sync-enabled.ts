import { isEmpty, isNullish } from 'remeda';

import type { SyncEnabledInput } from './sync-enabled.types';

import { peerClientNames } from '../../../../../peers';

export const syncEnabled = async ({ xray, peers, nodeClients }: SyncEnabledInput): Promise<boolean> => {
  const toEnable: string[] = [];
  const toDisable: string[] = [];

  for (const peer of peers) {
    if (peer.state !== 'active' && peer.state !== 'disabled') {
      continue;
    }

    const email = peerClientNames(peer).find((candidate) => nodeClients.has(candidate));

    if (isNullish(email)) {
      continue;
    }

    const desired = peer.state === 'active';

    if (nodeClients.get(email) !== desired) {
      (desired ? toEnable : toDisable).push(email);
    }
  }

  if (isEmpty(toEnable) && isEmpty(toDisable)) {
    return false;
  }

  await Promise.all([xray.setClientsEnabled({ emails: toEnable, enabled: true }), xray.setClientsEnabled({ emails: toDisable, enabled: false })]);

  return true;
};
