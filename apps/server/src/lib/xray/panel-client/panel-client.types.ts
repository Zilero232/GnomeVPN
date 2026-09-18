export type PanelClientInput = {
  baseUrl: string;
  token: string;
  timeout: number;
};

export type PanelResponse<T> = {
  success: boolean;
  msg: string;
  obj: T;
};

export type PanelClientStat = {
  email: string;
  up?: number;
  down?: number;
};

export type PanelInbound = {
  id: number;
  enable: boolean;
  remark: string;
  port: number;
  protocol: string;
  settings: string | Record<string, unknown>;
  streamSettings?: string | Record<string, unknown>;
  sniffing?: string | Record<string, unknown>;
  clientStats?: PanelClientStat[];
};

export type PanelResourceUsage = {
  current?: number;
  total?: number;
};

export type PanelServerStatus = {
  cpu?: number;
  mem?: PanelResourceUsage;
  disk?: PanelResourceUsage;
  tcpCount?: number;
  xray?: {
    state?: string;
  };
};

export type PanelOnlines = Record<string, string[]> | string[] | null;

export type SetClientsEnabledInput = {
  emails: string[];
  enabled: boolean;
};

export type AddVlessClientInput = {
  inboundId: number;
  email: string;
  id: string;
  limitIp: number;
};

export type AddClientInput = {
  inboundId: number;
  email: string;
  auth: string;
  limitIp: number;
};

export type AddPanelClientInput = {
  inboundId: number;
  client: Record<string, unknown>;
};

export type UpdateInboundInput = {
  id: number;
  payload: unknown;
};
