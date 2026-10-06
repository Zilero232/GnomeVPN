import { subHours } from 'date-fns';
import { isEmpty, isNullish, unique } from 'remeda';

import type { ReconcilePeer } from '../../reconcile-peers.job.types';
import type { ReleaseLegacyInput } from './release-legacy.types';

import { LEGACY_PEER } from '../../../../../devices';
import { peerClientNames } from '../../../../../peers';
import { deleteNodeClients } from '../delete-node-clients';
import { isReplacedLegacyPeer } from './release-legacy.helpers';

export const releaseLegacy = async ({ prisma, xray, peers, nodeClients, online, now }: ReleaseLegacyInput): Promise<ReconcilePeer[]> => {
  const owners = unique(peers.filter((peer) => peer.name === LEGACY_PEER.name).map((peer) => peer.userId));

  if (isNullish(online) || isEmpty(owners)) {
    return [];
  }

  const settled = await prisma.device.findMany({
    where: { userId: { in: owners }, createdAt: { lt: subHours(now, LEGACY_PEER.graceHours) } },
    distinct: ['userId'],
    select: { userId: true }
  });

  const replaced = new Set(settled.map((device) => device.userId));

  const idle = peers.filter((peer) => isReplacedLegacyPeer({ peer, replaced }) && !peerClientNames(peer).some((email) => online.has(email)));

  if (isEmpty(idle)) {
    return [];
  }

  await deleteNodeClients({ xray, peers: idle, nodeClients });

  await prisma.peer.deleteMany({ where: { id: { in: idle.map((peer) => peer.id) } } });

  return idle;
};
