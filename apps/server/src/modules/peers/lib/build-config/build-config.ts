import { CLIENT_FINGERPRINT, TUNNEL_DNS } from '../../config';

import type { TunnelConfig } from '@gnomevpn/schemas';
import type { BuildConfigInput } from './build-config.types';

export const buildTunnelConfig = ({ node, xrayUserId }: BuildConfigInput): TunnelConfig => ({
  server: node.host,
  port: node.port,
  userId: xrayUserId,
  serverName: node.realityServerName,
  publicKey: node.realityPublicKey,
  shortId: node.realityShortId,
  fingerprint: CLIENT_FINGERPRINT,
  dns: TUNNEL_DNS,
});
