import { filter, isEmpty, isNonNullish, isNullish, pipe, unique } from 'remeda';

import type { CollectOrphansInput, WithoutAnOwnerInput } from './collect-orphans.types';

import { peerClientNames } from '../../../../../peers';
import { ownerIdOf } from '../orphan-owner';
import { isServerOwned } from './collect-orphans.helpers';

const withoutAnOwner = async ({ prisma, emails }: WithoutAnOwnerInput): Promise<string[]> => {
  if (isEmpty(emails)) {
    return [];
  }

  const owners = new Map(emails.map((email) => [email, ownerIdOf(email)]));
  const named = pipe([...owners.values()], filter(isNonNullish), unique());

  const alive = await prisma.user.findMany({ where: { id: { in: named } }, select: { id: true } });
  const living = new Set(alive.map((user) => user.id));

  return emails.filter((email) => {
    const owner = owners.get(email);

    return isNonNullish(owner) && !living.has(owner);
  });
};

export const collectOrphans = async ({ prisma, xray, peers, nodeClients, online }: CollectOrphansInput): Promise<boolean> => {
  if (isNullish(online)) {
    return false;
  }

  const known = new Set(peers.flatMap((peer) => peerClientNames(peer)));

  const candidates = [...nodeClients.keys()].filter((email) => !known.has(email) && isServerOwned(email) && !online.has(email));

  const doomed = await withoutAnOwner({ prisma, emails: candidates });

  await Promise.all(doomed.map((email) => xray.deleteClient(email)));

  return !isEmpty(doomed);
};
