import type { TunnelConfig } from '@gnomevpn/schemas';

export type IncyServerUriInput = {
  config: TunnelConfig;
  country: string;
  countryCode: string;
  city: string | null;
};
