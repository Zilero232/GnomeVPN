import { DEFAULT_TUNNEL_PROTOCOL, TUNNEL_PROTOCOL } from '@gnomevpn/schemas';

import type { ProtocolOption } from '../model/protocol.types';

export const DEFAULT_PROTOCOL = DEFAULT_TUNNEL_PROTOCOL;

export const PROTOCOL_OPTIONS: ProtocolOption[] = [
  {
    protocol: TUNNEL_PROTOCOL.hysteria2,
    icon: 'zap',
    isRecommended: true,
    tagKey: 'protocol.hysteria2Tag',
    descKey: 'protocol.hysteria2Desc',
    traits: [
      { key: 'protocol.traitBlocking', grade: 'high' },
      { key: 'protocol.traitSpeed', grade: 'high' }
    ]
  },
  {
    protocol: TUNNEL_PROTOCOL.wireguard,
    icon: 'shield',
    descKey: 'protocol.wireguardDesc',
    traits: [
      { key: 'protocol.traitBlocking', grade: 'mid' },
      { key: 'protocol.traitSpeed', grade: 'high' }
    ]
  }
];

export const PROTOCOLS = PROTOCOL_OPTIONS.map((option) => option.protocol);
