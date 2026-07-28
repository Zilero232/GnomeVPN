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

export type PanelTraffic = {
  up: number;
  down: number;
};
