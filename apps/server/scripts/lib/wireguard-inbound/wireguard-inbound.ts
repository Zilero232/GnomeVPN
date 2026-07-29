import type { BuildWireguardInboundInput } from './wireguard-inbound.types';

import { WG_INBOUND_TAG } from './wireguard-inbound.constants';

export const buildWireguardInbound = ({
  secretKey,
  listenPort,
  mtu
}: BuildWireguardInboundInput): Record<string, unknown> => ({
  tag: WG_INBOUND_TAG,
  listen: null,
  port: listenPort,
  protocol: 'wireguard',
  settings: {
    secretKey,
    clients: [],
    mtu
  }
});
