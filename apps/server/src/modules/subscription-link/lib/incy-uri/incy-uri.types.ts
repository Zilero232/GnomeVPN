import type { TunnelConfig } from '@gnomevpn/schemas';

export type IncyServerName = {
  country: string;
  countryCode: string;
  city: string | null;
  suffix?: string;
};

export type IncyServerUriInput = {
  config: TunnelConfig;
  country: string;
  countryCode: string;
  city: string | null;
};
