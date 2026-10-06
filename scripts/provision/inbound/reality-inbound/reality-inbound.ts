import type { BuildRealityInboundInput } from './reality-inbound.types';

import { PORTS, REALITY_DONOR } from '../../config';
import { REALITY_INBOUND } from './reality-inbound.constants';

export const buildRealityInbound = ({ privateKey, shortId }: BuildRealityInboundInput): Record<string, unknown> => ({
  tag: REALITY_INBOUND.tag,
  listen: null,
  port: PORTS.reality,
  protocol: 'vless',
  settings: {
    clients: [],
    decryption: 'none'
  },
  streamSettings: {
    network: REALITY_INBOUND.network,
    security: 'reality',
    realitySettings: {
      show: false,
      dest: REALITY_DONOR.dest,
      xver: 0,
      serverNames: [...REALITY_DONOR.serverNames],
      privateKey,
      shortIds: [shortId]
    },
    grpcSettings: {
      serviceName: REALITY_INBOUND.serviceName,
      multiMode: false
    }
  },
  sniffing: {
    enabled: true,
    destOverride: [...REALITY_INBOUND.sniff]
  }
});
