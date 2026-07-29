import slugify from '@sindresorhus/slugify';

import type { PeerNameInput } from './peer-name.types';

import { PEER_PREFIX } from '../../config';

export const peerClientName = ({ userId, kind, name, nodeId }: PeerNameInput): string => {
  const prefix = kind === 'session' ? PEER_PREFIX.session : PEER_PREFIX.config;
  const base = `${prefix}${userId}-${slugify(name ?? '')}`;

  return nodeId ? `${base}-${nodeId}` : base;
};
