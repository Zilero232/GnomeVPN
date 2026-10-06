import { isEmpty, isNonNullish } from 'remeda';

import type { ReleaseRevokedInput } from './release-revoked.types';

import { deleteNodeClients } from '../delete-node-clients';

export const releaseRevoked = async ({ prisma, xray, peers, nodeClients }: ReleaseRevokedInput): Promise<boolean> => {
  const revoked = peers.filter((peer) => isNonNullish(peer.revokedAt));

  if (isEmpty(revoked)) {
    return false;
  }

  const onNode = await deleteNodeClients({ xray, peers: revoked, nodeClients });

  await prisma.peer.deleteMany({
    where: { id: { in: revoked.map((peer) => peer.id) }, revokedAt: { not: null } }
  });

  return !isEmpty(onNode);
};
