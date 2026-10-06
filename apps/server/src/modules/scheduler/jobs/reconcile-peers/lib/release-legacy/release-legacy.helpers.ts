import { isNullish } from 'remeda';

import type { IsLegacyPeerInput } from './release-legacy.types';

import { LEGACY_PEER } from '../../../../../devices';

export const isReplacedLegacyPeer = ({ peer, replaced }: IsLegacyPeerInput): boolean =>
  peer.kind === 'config' && peer.name === LEGACY_PEER.name && isNullish(peer.deviceId) && isNullish(peer.revokedAt) && replaced.has(peer.userId);
