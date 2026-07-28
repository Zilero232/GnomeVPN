import slugify from '@sindresorhus/slugify';

import { PEER_PREFIX } from '../../config';

import type { PeerNameInput } from './peer-name.types';

export const peerClientName = ({ userId, kind, name, nodeId }: PeerNameInput): string => {
  const prefix = kind === 'session' ? PEER_PREFIX.session : PEER_PREFIX.config;
  const base = `${prefix}${userId}-${slugify(name ?? '')}`;

  return kind === 'config' && nodeId ? `${base}-${nodeId}` : base;
};
