export type XrayInbound = {
  id: number;
  enable: boolean;
  remark: string;
  port: number;
  settings: string | Record<string, unknown>;
  streamSettings?: string | Record<string, unknown>;
  sniffing?: string | Record<string, unknown>;
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

export type XrayInboundSettings = {
  clients?: ({ email?: string; auth?: string } | null)[];
};

export type WriteInboundClientsInput = {
  inbound: XrayInbound;
  protocol: string;
  settings: Record<string, unknown>;
  remark: string;
};
