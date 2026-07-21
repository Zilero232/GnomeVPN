import slugify from '@sindresorhus/slugify';

import { CLIENT_FLOW } from '../../../../lib/xray';

import type { ConfigFileNameInput, RenderConfigInput } from './config-file.types';

export const configFileName = ({ countryCode, deviceName }: ConfigFileNameInput): string =>
  ['GnomeVPN', slugify(countryCode).toUpperCase(), deviceName ? slugify(deviceName) : '']
    .filter(Boolean)
    .join('-');

export const renderConfigFile = ({ config, deviceName, country }: RenderConfigInput): string => {
  const params = new URLSearchParams({
    type: 'tcp',
    security: 'reality',
    sni: config.serverName,
    fp: config.fingerprint,
    pbk: config.publicKey,
    flow: CLIENT_FLOW,
    ...(config.shortId ? { sid: config.shortId } : {}),
  });

  const label = encodeURIComponent(`GnomeVPN ${country} · ${deviceName}`);

  return `vless://${config.userId}@${config.server}:${config.port}?${params}#${label}\n`;
};
