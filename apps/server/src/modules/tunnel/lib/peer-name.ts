import slugify from '@sindresorhus/slugify';

import { CONFIG_PEER_PREFIX, SESSION_PEER_PREFIX } from '../config';

import type { PeerNameInput } from './peer-name.types';

export const peerClientName = ({ userId, kind, name }: PeerNameInput): string =>
  kind === 'session'
    ? `${SESSION_PEER_PREFIX}${userId}`
    : `${CONFIG_PEER_PREFIX}${userId}-${slugify(name ?? '')}`;
