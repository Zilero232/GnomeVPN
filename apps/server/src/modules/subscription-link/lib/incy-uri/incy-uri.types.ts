import type { TunnelConfig } from '@gnomevpn/schemas';

import type { TlsMode } from '../tls-mode';

export type IncyServerUriInput = {
  config: TunnelConfig;
  country: string;
  countryCode: string;
  city: string | null;
  tls: TlsMode;
};
