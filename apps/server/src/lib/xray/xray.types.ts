export type XrayClientOptions = {
  baseUrl: string;
  token: string;
};

export type XrayClientRow = {
  email: string;
  uuid: string;
  enable: boolean;
};

export type XrayClientTraffic = {
  email: string;
  up: number;
  down: number;
};

export type XrayInbound = {
  id: number;
  enable: boolean;
  remark: string;
  settings: string | Record<string, unknown>;
};

export type XrayApiResponse<T> = {
  success: boolean;
  msg: string;
  obj: T;
};

export type CreateClientResult = {
  xrayUserId: string;
  email: string;
};
