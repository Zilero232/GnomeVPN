import slugify from '@sindresorhus/slugify';
import { isTruthy } from 'remeda';

import type { ConfigFileNameInput, RenderConfigInput } from './config-file.types';

const titleCase = (value: string) =>
  slugify(value)
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

export const configFileName = ({ country, deviceName }: ConfigFileNameInput): string =>
  ['GnomeVPN', titleCase(country), deviceName ? titleCase(deviceName) : ''].filter(isTruthy).join('-');

export const renderHysteria2Config = ({ config, deviceName, country }: RenderConfigInput): string => {
  const url = new URL(`hy2://${config.server}`);

  url.username = config.auth;
  url.port = String(config.port);
  url.pathname = '/';
  url.searchParams.set('sni', config.serverName);

  if (config.insecure) {
    url.searchParams.set('insecure', '1');
  }

  url.hash = `GnomeVPN ${country} · ${deviceName}`;

  return `${url.toString()}\n`;
};
