import type { InboundConfig, ModernApiResponse } from '3xui-api-client';

export type XrayClientOptions = {
  baseUrl: string;
  token: string;
};

// The panel returns an inbound with more than InboundConfig describes, and
// `settings` arrives as a JSON string on some endpoints and an object on
// others.
export type XrayInbound = {
  id: number;
  enable: boolean;
  remark: string;
  settings: string | Record<string, unknown>;
};

export type XrayApiResponse<T> = ModernApiResponse<T>;

export type CreateClientResult = {
  xrayUserId: string;
  email: string;
};

// The panel accepts a sniffing block on an inbound, but InboundConfig from
// 3xui-api-client stops at streamSettings.
export type XrayInboundPayload = InboundConfig & {
  sniffing?: string;
};
