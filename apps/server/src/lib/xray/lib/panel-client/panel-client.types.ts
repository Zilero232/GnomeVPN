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

export type PanelInbound = {
  id: number;
  enable: boolean;
  remark: string;
  port: number;
  protocol: string;
  settings: string | Record<string, unknown>;
  streamSettings?: string | Record<string, unknown>;
  sniffing?: string | Record<string, unknown>;
};

export type PanelServerStatus = {
  xray?: {
    state?: string;
  };
};

export type PanelOnlines = Record<string, string[]> | string[] | null;

export type SetClientsEnabledInput = {
  emails: string[];
  enabled: boolean;
};

export type AddClientInput = {
  inboundId: number;
  email: string;
  auth: string;
};
