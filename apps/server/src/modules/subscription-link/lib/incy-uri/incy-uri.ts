import { TUNNEL_PROTOCOL } from '@gnomevpn/schemas';
import { isTruthy } from 'remeda';
import { match } from 'ts-pattern';

import type { IncyServerName, IncyServerUriInput } from './incy-uri.types';

import { VLESS_NAME_SUFFIX } from '../../config';

const REGIONAL_INDICATOR_A = '🇦'.codePointAt(0) ?? 0;
const LATIN_A = 'A'.charCodeAt(0);

const countryFlag = (countryCode: string): string => {
  const code = countryCode.trim().toUpperCase();

  if (!/^[A-Z]{2}$/.test(code)) {
    return '';
  }

  return String.fromCodePoint(...[...code].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LATIN_A));
};

export const incyServerName = ({ country, countryCode, city, suffix }: IncyServerName): string =>
  [countryFlag(countryCode), country, city, suffix].filter(isTruthy).join(' ');

const hysteria2Uri = ({ config, country, countryCode, city }: IncyServerUriInput): string => {
  const url = new URL(`hy2://${config.server}`);

  url.username = config.auth;
  url.port = String(config.port);
  url.pathname = '/';
  url.searchParams.set('sni', config.serverName);

  if (config.insecure) {
    url.searchParams.set('insecure', '1');
  }

  url.hash = incyServerName({ country, countryCode, city });

  return url.toString();
};

const vlessUri = ({ config, country, countryCode, city }: IncyServerUriInput): string => {
  if (!config.reality) {
    return '';
  }

  const url = new URL(`vless://${config.server}`);

  url.username = config.auth;
  url.port = String(config.port);
  url.pathname = '/';

  url.searchParams.set('type', 'tcp');
  url.searchParams.set('security', 'reality');
  url.searchParams.set('encryption', 'none');
  url.searchParams.set('sni', config.serverName);
  url.searchParams.set('fp', config.reality.fingerprint);
  url.searchParams.set('pbk', config.reality.publicKey);
  url.searchParams.set('sid', config.reality.shortId);

  if (config.reality.flow) {
    url.searchParams.set('flow', config.reality.flow);
  }

  url.hash = incyServerName({ country, countryCode, city, suffix: VLESS_NAME_SUFFIX });

  return url.toString();
};

export const incyServerUri = (input: IncyServerUriInput): string =>
  match(input.config.protocol)
    .with(TUNNEL_PROTOCOL.vless, () => vlessUri(input))
    .otherwise(() => hysteria2Uri(input));
