import slugify from '@sindresorhus/slugify';

import type { ConfigFileNameInput, RenderConfigInput } from './config-file.types';

export const configFileName = ({ countryCode, deviceName }: ConfigFileNameInput): string =>
  ['GnomeVPN', slugify(countryCode).toUpperCase(), deviceName ? slugify(deviceName) : '']
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
