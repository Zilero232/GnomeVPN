import {
  DONOR_HOST,
  DONOR_PORT,
  INBOUND_TAG,
  LISTEN_PORT,
  SNIFF_PROTOCOLS,
  XHTTP_MODE,
  XHTTP_PATH,
} from './reality-inbound.constants';

import type { BuildInboundInput } from './reality-inbound.types';

export const buildRealityInbound = ({
  privateKey,
  shortId,
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
    network: 'xhttp',
    security: 'reality',
    xhttpSettings: {
      path: XHTTP_PATH,
      mode: XHTTP_MODE,
    },
    realitySettings: {
      show: false,
      dest: `${DONOR_HOST}:${DONOR_PORT}`,
      xver: 0,
      serverNames: [DONOR_HOST],
      privateKey,
      shortIds: [shortId],
    },
  },
  sniffing: {
    enabled: true,
    destOverride: SNIFF_PROTOCOLS,
  },
});
