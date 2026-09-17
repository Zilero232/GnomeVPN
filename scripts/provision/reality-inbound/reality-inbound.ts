import type { BuildRealityInboundInput } from './reality-inbound.types';

import {
  REALITY_DEST,
  REALITY_INBOUND_TAG,
  REALITY_LISTEN_PORT,
  REALITY_NETWORK,
  REALITY_SERVER_NAMES,
  REALITY_SERVICE_NAME,
  SNIFF_PROTOCOLS
} from './reality-inbound.constants';

export const buildRealityInbound = ({ privateKey, shortId }: BuildRealityInboundInput): Record<string, unknown> => ({
  tag: REALITY_INBOUND_TAG,
  listen: null,
  port: REALITY_LISTEN_PORT,
  protocol: 'vless',
  settings: {
    clients: [],
    decryption: 'none'
  },
  streamSettings: {
    network: REALITY_NETWORK,
    security: 'reality',
    realitySettings: {
      show: false,
      dest: REALITY_DEST,
      xver: 0,
      serverNames: REALITY_SERVER_NAMES,
      privateKey,
      shortIds: [shortId]
    },
    grpcSettings: {
      serviceName: REALITY_SERVICE_NAME,
      multiMode: false
    }
  },
  sniffing: {
    enabled: true,
    destOverride: SNIFF_PROTOCOLS
  }
});
