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

export type XrayInboundSettings = {
  clients?: ({ email?: string; auth?: string } | null)[];
};

export type XrayWireguardSettings = {
  secretKey?: string;
  clients?: ({ email?: string; publicKey?: string; allowedIPs?: string[] } | null)[];
  peers?: unknown;
  mtu?: number;
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

export type SetClientEnabledInput = {
  email: string;
  enabled: boolean;
};

export type SetClientsEnabledInput = {
  emails: string[];
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

export type WireguardInboundInput = {
  tag: string;
  listen: string | null;
  port: number;
  protocol: string;
  settings: {
    secretKey: string;
    clients: WireguardClient[];
    mtu: number;
  };
};
