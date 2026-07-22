import type { NodeConfig } from '../nodes-config';
import type { PrismaLike } from '../upsert-node';

export type ProvisionStatus = 'provisioned' | 'updated' | 'failed';

export type ProvisionResult = {
  host: string;
  country: string;
  status: ProvisionStatus;
  error?: string;
};

export type ProvisionHostInput = {
  config: NodeConfig;
  prisma: PrismaLike;
  serverEnvPath: string;
  xrayComposeContent: string;
};

export type RememberNodeSecretsInput = {
  serverEnvPath: string;
  countryCode: string;
  apiToken: string;
  panelPassword: string;
  panelPath: string;
};

export type PanelUrlInput = {
  host: string;
  panelPath: string;
};

export type WaitForPanelInput = {
  baseUrl: string;
  token: string;
};
