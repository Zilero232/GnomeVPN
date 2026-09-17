import { isNullish } from 'remeda';

import { PEER_PREFIX } from '../../../../../peers';
import { OWNER_ID } from './orphan-owner.constants';

export const ownerIdOf = (email: string): string | null => {
  const prefix = Object.values(PEER_PREFIX).find((candidate) => email.startsWith(candidate));

  if (isNullish(prefix)) {
    return null;
  }

  const [userId] = email.slice(prefix.length).split('-');

  return OWNER_ID.test(userId ?? '') ? userId : null;
};
