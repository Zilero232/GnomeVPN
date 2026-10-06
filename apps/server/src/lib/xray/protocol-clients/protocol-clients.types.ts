import type { Inbounds } from '../inbounds';
import type { PanelClient } from '../panel-client';

export type ProtocolClient = {
  email: string;
  enable?: boolean;
};

export type AddProtocolClientInput = {
  inboundId: number;
  email: string;
  credential: string;
  limitIp: number;
};

export type ProtocolClientsDeps = {
  panel: PanelClient;
  inbounds: Inbounds;
  nodeKey: string;
};

export type ProtocolClientsInput<TClient extends ProtocolClient> = ProtocolClientsDeps & {
  remark?: string;
  credentialOf: (client: TClient) => string | undefined;
  add: (input: AddProtocolClientInput) => Promise<void>;
};

export type IssueProtocolClientInput = {
  email: string;
  credential: string;
  limitIp: number;
  deferRestart?: boolean;
};

export type IssueProtocolClientResult = {
  nodeCredential: string;
  email: string;
};
