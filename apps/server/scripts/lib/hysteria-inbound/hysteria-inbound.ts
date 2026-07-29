import type { BuildInboundInput } from './hysteria-inbound.types';

import {
  CERT_PATH,
  INBOUND_TAG,
  KEY_PATH,
  LISTEN_PORT,
  MASQUERADE_HOST,
  SNIFF_PROTOCOLS,
  UDP_IDLE_TIMEOUT
} from './hysteria-inbound.constants';

export const buildHysteriaInbound = ({
  auth,
  sni
}: BuildInboundInput): Record<string, unknown> => ({
  tag: INBOUND_TAG,
  listen: null,
  port: LISTEN_PORT,
  protocol: 'hysteria',
  settings: {
    version: 2,
    clients: [{ auth }]
  },
  streamSettings: {
    network: 'hysteria',
    security: 'tls',
    hysteriaSettings: {
      version: 2,
      udpIdleTimeout: UDP_IDLE_TIMEOUT,
      masquerade: {
        type: 'proxy',
        url: `https://${MASQUERADE_HOST}`,
        rewriteHost: true,
        insecure: false
      }
    },
    tlsSettings: {
      serverName: sni,
      minVersion: '1.3',
      maxVersion: '1.3',
      alpn: ['h3'],
      certificates: [
        {
          certificateFile: CERT_PATH,
          keyFile: KEY_PATH,
          usage: 'encipherment'
        }
      ]
    }
  },
  sniffing: {
    enabled: true,
    destOverride: SNIFF_PROTOCOLS
  }
});
