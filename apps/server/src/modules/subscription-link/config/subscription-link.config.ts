export const SUBSCRIPTION_CONTENT_TYPE = 'text/plain; charset=utf-8';

export const SUBSCRIPTION_PATH = '/sub';

export const SUBSCRIPTION_PEER_NAME = 'incy';

export const INCY_DEEP_LINK_NAME = 'GnomeVPN';

export const NODE_FEED_SELECT = {
  id: true,
  country: true,
  countryCode: true,
  city: true,
  host: true,
  port: true,
  serverName: true,
  certFingerprint: true,
  apiUrl: true,
  apiTokenEnvVar: true,
  realityPublicKey: true,
  realityShortId: true
} as const;
