import slugify from '@sindresorhus/slugify';

import type { ConfigFileNameInput, RenderConfigInput } from './config-file.types';

const titleCase = (value: string): string =>
  slugify(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const configFileName = ({ country, deviceName }: ConfigFileNameInput): string =>
  ['GnomeVPN', titleCase(country), deviceName ? titleCase(deviceName) : '']
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
