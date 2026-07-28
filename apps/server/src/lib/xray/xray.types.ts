import type { TunnelProtocol } from '@gnomevpn/schemas';
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

export type XrayServerStatus = {
  xray?: {
    state?: string;
  };
};

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
  nodeCredential: string;
  email: string;
};

export type WireguardClient = {
  email: string;
  id: string;
  publicKey: string;
  allowedIPs: string[];
  preSharedKey: string;
  keepAlive: number;
  enable: boolean;
};

export type WireguardInboundSettings = {
  secretKey?: string;
  clients?: (WireguardClient | null)[];
  mtu?: number;
};

export type AddWireguardPeerInput = {
  email: string;
  publicKey: string;
  takenIps: string[];
  allocateIp: (takenIps: string[]) => string | null;
};

export type NewWireguardClientInput = {
  email: string;
  publicKey: string;
  assignedIp: string;
};

export type RemoveWireguardPeerInput = {
  email: string;
};

export type RemovePeerInput = {
  email: string;
  protocol: TunnelProtocol;
};

export type XrayInboundPayload = InboundConfig & {
  sniffing?: string;
};
