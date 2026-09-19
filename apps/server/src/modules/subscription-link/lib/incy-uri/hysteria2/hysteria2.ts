import { isNonNullish } from 'remeda';

import type { IncyServerUriInput } from '../incy-uri.types';

import { serverName } from '../../server-name';
import { HYSTERIA2_SCHEME, INSECURE } from './hysteria2.constants';
import { pinnedFingerprint } from './hysteria2.helpers';

export const hysteria2Uri = ({ config, country, countryCode, city }: IncyServerUriInput): string => {
  const url = new URL(`${HYSTERIA2_SCHEME}://${config.server}`);
  const pinned = config.certFingerprint ? pinnedFingerprint(config.certFingerprint) : null;

  url.username = config.auth;
  url.port = String(config.port);
  url.pathname = '/';
  url.searchParams.set('sni', config.serverName);

  if (isNonNullish(pinned)) {
    url.searchParams.set('pinSHA256', pinned);
  } else if (config.insecure) {
    url.searchParams.set('insecure', INSECURE);
  }

  url.hash = serverName({ country, countryCode, city });

  return url.toString();
};
