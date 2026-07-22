import slugify from '@sindresorhus/slugify';

import { XHTTP_MODE, XHTTP_PATH } from '../../config';

import type { ConfigFileNameInput, RenderConfigInput } from './config-file.types';

export const configFileName = ({ countryCode, deviceName }: ConfigFileNameInput): string =>
  ['GnomeVPN', slugify(countryCode).toUpperCase(), deviceName ? slugify(deviceName) : '']
    .filter(Boolean)
    .join('-');

export const renderConfigFile = ({ config, deviceName, country }: RenderConfigInput): string => {
  const params = new URLSearchParams({
    type: 'xhttp',
    security: 'reality',
    path: XHTTP_PATH,
    mode: XHTTP_MODE,
    sni: config.serverName,
    fp: config.fingerprint,
    pbk: config.publicKey,
    ...(config.shortId ? { sid: config.shortId } : {}),
  });

  const label = encodeURIComponent(`GnomeVPN ${country} · ${deviceName}`);

  return `vless://${config.userId}@${config.server}:${config.port}?${params}#${label}\n`;
};
