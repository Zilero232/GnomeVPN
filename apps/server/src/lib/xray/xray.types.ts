import type { InboundConfig, ModernApiResponse } from '3xui-api-client';

export type XrayClientOptions = {
  baseUrl: string;
  token: string;
};

export type XrayInbound = {
  id: number;
  enable: boolean;
  remark: string;
  port: number;
  settings: string | Record<string, unknown>;
  streamSettings?: string | Record<string, unknown>;
  sniffing?: string | Record<string, unknown>;
};

export type XrayApiResponse<T> = ModernApiResponse<T>;

export type HysteriaClient = {
  email: string;
  auth: string;
  enable?: boolean;
  limitIp?: number;
  totalGB?: number;
  expiryTime?: number;
  tgId?: number;
  reset?: number;
};

export type CreateClientResult = {
  xrayUserId: string;
  email: string;
};

export type XrayInboundPayload = InboundConfig & {
  sniffing?: string;
};
