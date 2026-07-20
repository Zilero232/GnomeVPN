import slugify from '@sindresorhus/slugify';

import type { RenderConfigInput } from './config-file.types';

export const configFileName = (countryCode: string, deviceName?: string): string =>
  ['GnomeVPN', slugify(countryCode).toUpperCase(), deviceName ? slugify(deviceName) : '']
    .filter(Boolean)
    .join('-');

export const renderConfigFile = ({ config, deviceName, country }: RenderConfigInput): string =>
  [
    `# GnomeVPN — ${deviceName} · ${country}`,
    '[Interface]',
    `PrivateKey = ${config.privateKey}`,
    `Address = ${config.address}`,
    `DNS = ${config.dns}`,
    '',
    '[Peer]',
    `PublicKey = ${config.serverPublicKey}`,
    ...(config.presharedKey ? [`PresharedKey = ${config.presharedKey}`] : []),
    `Endpoint = ${config.endpoint}`,
    `AllowedIPs = ${config.allowedIps.join(', ')}`,
    `PersistentKeepalive = ${config.persistentKeepalive}`,
    '',
  ].join('\n');
