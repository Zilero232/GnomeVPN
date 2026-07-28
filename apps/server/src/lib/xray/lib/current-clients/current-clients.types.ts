export type XrayInboundSettings = {
  clients?: ({ email?: string; auth?: string } | null)[];
};

export type XrayWireguardSettings = {
  secretKey?: string;
  clients?: ({ email?: string; publicKey?: string; allowedIPs?: string[] } | null)[];
  mtu?: number;
};
