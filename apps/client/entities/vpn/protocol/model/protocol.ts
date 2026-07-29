import { DEFAULT_TUNNEL_PROTOCOL, TUNNEL_PROTOCOL } from '@gnomevpn/schemas';

import type { ProtocolOption } from './protocol.types';

export const DEFAULT_PROTOCOL = DEFAULT_TUNNEL_PROTOCOL;

export const PROTOCOL_OPTIONS: ProtocolOption[] = [
  {
    protocol: TUNNEL_PROTOCOL.hysteria2,
    tagKey: 'protocol.hysteria2Tag',
    descKey: 'protocol.hysteria2Desc'
  },
  {
    protocol: TUNNEL_PROTOCOL.wireguard,
    descKey: 'protocol.wireguardDesc'
  }
];

export const PROTOCOLS = PROTOCOL_OPTIONS.map((option) => option.protocol);
