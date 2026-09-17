import type { IncyServerUriInput } from '../incy-uri.types';

import { serverName } from '../../server-name';
import { VLESS_ENCRYPTION, VLESS_NAME_SUFFIX, VLESS_NETWORK, VLESS_SCHEME, VLESS_SECURITY } from './vless.constants';

export const vlessUri = ({ config, country, countryCode, city }: IncyServerUriInput): string => {
  if (!config.reality) {
    return '';
  }

  const url = new URL(`${VLESS_SCHEME}://${config.server}`);

  url.username = config.auth;
  url.port = String(config.port);
  url.pathname = '/';

  url.searchParams.set('type', VLESS_NETWORK);
  url.searchParams.set('security', VLESS_SECURITY);
  url.searchParams.set('encryption', VLESS_ENCRYPTION);
  url.searchParams.set('sni', config.serverName);
  url.searchParams.set('fp', config.reality.fingerprint);
  url.searchParams.set('pbk', config.reality.publicKey);
  url.searchParams.set('sid', config.reality.shortId);

  if (config.reality.flow) {
    url.searchParams.set('flow', config.reality.flow);
  }

  url.hash = serverName({ country, countryCode, city, suffix: VLESS_NAME_SUFFIX });

  return url.toString();
};
