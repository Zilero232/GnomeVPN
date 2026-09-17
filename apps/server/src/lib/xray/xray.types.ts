import type { XrayInbound } from './inbounds';

export type XrayClientOptions = {
  baseUrl: string;
  token: string;
};

export type IssueClientInput = {
  email: string;
  auth?: string;
  deferRestart?: boolean;
};

export type IssueVlessClientInput = {
  email: string;
  id?: string;
  deferRestart?: boolean;
};

export type RewriteInboundInput = {
  current: XrayInbound;
  inbound: Record<string, unknown>;
  remark?: string;
};
