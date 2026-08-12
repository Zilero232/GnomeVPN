import type { TunnelConfig } from '@gnomevpn/schemas';

import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';

import type { BuildConfigInput } from './build-config.types';

import { AppServiceUnavailableException } from '../../../../common/exceptions';
import { TUNNEL, WG } from '../../config';

const buildHysteria2Config = ({ node, auth }: BuildConfigInput): TunnelConfig => ({
  protocol: TUNNEL_PROTOCOL.hysteria2,
  server: node.host,
  port: node.port,
  auth,
  serverName: node.serverName,
  insecure: TUNNEL.insecure,
  dns: [...TUNNEL.dns]
});

const buildWireguardConfig = ({ node, wgPrivateKey, wgAssignedIp }: BuildConfigInput): TunnelConfig => {
  if (!node.wgPublicKey || !wgPrivateKey || !wgAssignedIp) {
    throw new AppServiceUnavailableException('NODE_UNAVAILABLE', 'node has no wireguard endpoint');
  }

  return {
    protocol: TUNNEL_PROTOCOL.wireguard,
    server: node.host,
    port: WG.listenPort,
    auth: '',
    serverName: '',
    insecure: false,
    dns: [...TUNNEL.dns],
    wireguard: {
      privateKey: wgPrivateKey,
      address: `${wgAssignedIp}/${WG.addressPrefix}`,
      peerPublicKey: node.wgPublicKey,
      allowedIps: [...WG.allowedIps],
      reserved: [],
      mtu: WG.mtu
    }
  };
};

export const buildTunnelConfig = (input: BuildConfigInput): TunnelConfig =>
  input.protocol === TUNNEL_PROTOCOL.wireguard ? buildWireguardConfig(input) : buildHysteria2Config(input);
