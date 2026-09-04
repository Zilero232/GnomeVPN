import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import slugify from '@sindresorhus/slugify';

import type { PeerNameInput } from './peer-name.types';

import { PEER_PREFIX } from '../../config';

export const peerClientName = ({ userId, kind, name, nodeId, protocol }: PeerNameInput): string => {
  const prefix = kind === 'session' ? PEER_PREFIX.session : PEER_PREFIX.config;
  const base = `${prefix}${userId}-${slugify(name ?? '')}`;
  const scoped = nodeId ? `${base}-${nodeId}` : base;

  return protocol === TUNNEL_PROTOCOL.wireguard ? `${scoped}-wg` : scoped;
};
