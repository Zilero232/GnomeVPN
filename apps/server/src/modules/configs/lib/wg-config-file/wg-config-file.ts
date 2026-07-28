import { WG_CONFIG_KEEPALIVE } from '../../config';

import type { RenderWireguardConfigInput } from './wg-config-file.types';

export const renderWireguardConfigFile = ({ config }: RenderWireguardConfigInput): string => {
  const wg = config.wireguard;

  if (!wg) {
    throw new Error('renderWireguardConfigFile called without wireguard settings');
  }

  const interfaceLines = [
    '[Interface]',
    `PrivateKey = ${wg.privateKey}`,
    `Address = ${wg.address}`,
    `DNS = ${config.dns.join(', ')}`,
    ...(wg.mtu ? [`MTU = ${wg.mtu}`] : []),
  ];

  const peerLines = [
    '[Peer]',
    `PublicKey = ${wg.peerPublicKey}`,
    `Endpoint = ${config.server}:${config.port}`,
    `AllowedIPs = ${wg.allowedIps.join(', ')}`,
    `PersistentKeepalive = ${WG_CONFIG_KEEPALIVE}`,
  ];

  return `${[...interfaceLines, '', ...peerLines].join('\n')}\n`;
};
