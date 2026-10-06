import type { BuildInboundInput } from './hysteria-inbound.types';

import { MASQUERADE_HOST, NODE_FILES, PORTS } from '../../config';
import { HYSTERIA_INBOUND } from './hysteria-inbound.constants';

export const buildHysteriaInbound = ({ auth, sni }: BuildInboundInput): Record<string, unknown> => ({
  tag: HYSTERIA_INBOUND.tag,
  listen: null,
  port: PORTS.hysteria,
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
      udpIdleTimeout: HYSTERIA_INBOUND.udpIdleTimeout,
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
          certificateFile: NODE_FILES.cert,
          keyFile: NODE_FILES.key,
          usage: 'encipherment'
        }
      ]
    }
  },
  sniffing: {
    enabled: true,
    destOverride: [...HYSTERIA_INBOUND.sniff]
  }
});
