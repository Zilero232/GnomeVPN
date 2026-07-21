import { DONOR_PORT, INBOUND_TAG, LISTEN_PORT, SNIFF_PROTOCOLS } from './reality-inbound.constants';

import type { BuildInboundInput } from './reality-inbound.types';

export const buildRealityInbound = ({
  privateKey,
  shortId,
  donorHost,
}: BuildInboundInput): Record<string, unknown> => ({
  tag: INBOUND_TAG,
  listen: null,
  port: LISTEN_PORT,
  protocol: 'vless',
  settings: {
    clients: [],
    decryption: 'none',
  },
  streamSettings: {
    network: 'tcp',
    security: 'reality',
    realitySettings: {
      show: false,
      dest: `${donorHost}:${DONOR_PORT}`,
      xver: 0,
      serverNames: [donorHost],
      privateKey,
      shortIds: [shortId],
    },
  },
  sniffing: {
    enabled: true,
    destOverride: SNIFF_PROTOCOLS,
  },
});
