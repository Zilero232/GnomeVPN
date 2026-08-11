export type XrayWireguardSettings = {
  secretKey?: string;
  clients?: ({ email?: string; publicKey?: string; allowedIPs?: string[] } | null)[];
  peers?: unknown;
  mtu?: number;
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
