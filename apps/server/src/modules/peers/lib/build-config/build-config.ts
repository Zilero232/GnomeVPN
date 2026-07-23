import { TUNNEL_DNS, TUNNEL_INSECURE } from '../../config';

import type { TunnelConfig } from '@gnomevpn/schemas';
import type { BuildConfigInput } from './build-config.types';

export const buildTunnelConfig = ({ node, auth }: BuildConfigInput): TunnelConfig => ({
  server: node.host,
  port: node.port,
  auth,
  serverName: node.serverName,
  insecure: TUNNEL_INSECURE,
  dns: TUNNEL_DNS,
});
