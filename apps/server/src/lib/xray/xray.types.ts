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

export type RemovePeerInput = {
  email: string;
};

export type SetPeerEnabledInput = {
  email: string;
  enabled: boolean;
};

export type XrayInboundPayload = {
  id?: number;
  remark: string;
  enable: boolean;
  port: number;
  protocol: string;
  settings: string;
  streamSettings?: string;
  sniffing?: string;
};

export type WriteInboundClientsInput = {
  inbound: XrayInbound;
  protocol: string;
  settings: Record<string, unknown>;
  remark: string;
};
