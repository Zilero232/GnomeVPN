import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import slugify from '@sindresorhus/slugify';

import { WIREGUARD_FILE_SUFFIX } from '../../config';

import type { ConfigFileNameInput, RenderConfigInput } from './config-file.types';

export const configFileName = ({
  countryCode,
  protocol,
  deviceName,
}: ConfigFileNameInput): string =>
  [
    'GnomeVPN',
    slugify(countryCode).toUpperCase(),
    deviceName ? slugify(deviceName) : '',
    protocol === TUNNEL_PROTOCOL.wireguard ? WIREGUARD_FILE_SUFFIX : '',
  ]
    .filter(Boolean)
    .join('-');

export const renderConfigFile = ({ config, deviceName, country }: RenderConfigInput): string => {
  const params = new URLSearchParams({
    sni: config.serverName,
    ...(config.insecure ? { insecure: '1' } : {}),
  });

  const label = encodeURIComponent(`GnomeVPN ${country} · ${deviceName}`);

  return `hy2://${config.auth}@${config.server}:${config.port}?${params}#${label}\n`;
};
