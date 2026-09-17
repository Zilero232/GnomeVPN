import type { IncyServerUriInput } from '../incy-uri.types';

import { serverName } from '../../server-name';
import { HYSTERIA2_SCHEME, INSECURE } from './hysteria2.constants';

export const hysteria2Uri = ({ config, country, countryCode, city }: IncyServerUriInput): string => {
  const url = new URL(`${HYSTERIA2_SCHEME}://${config.server}`);

  url.username = config.auth;
  url.port = String(config.port);
  url.pathname = '/';
  url.searchParams.set('sni', config.serverName);

  if (config.insecure) {
    url.searchParams.set('insecure', INSECURE);
  }

  url.hash = serverName({ country, countryCode, city });

  return url.toString();
};
