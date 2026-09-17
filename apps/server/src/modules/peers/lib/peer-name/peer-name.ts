import slugify from '@sindresorhus/slugify';

import type { PeerNameInput } from './peer-name.types';

import { PEER_PREFIX, PEER_PROTOCOL_SUFFIX } from '../../config';

export const peerClientName = ({ userId, kind, name, nodeId, protocol }: PeerNameInput): string => {
  const prefix = kind === 'session' ? PEER_PREFIX.session : PEER_PREFIX.config;
  const base = `${prefix}${userId}-${slugify(name ?? '')}`;
  const scoped = nodeId ? `${base}-${nodeId}` : base;

  return `${scoped}${protocol ? PEER_PROTOCOL_SUFFIX[protocol] : ''}`;
};
