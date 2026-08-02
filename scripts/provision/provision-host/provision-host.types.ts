import type { SshClient } from '@gnomevpn/scripts/ssh';

import type { NodeConfig } from '../nodes-config';
import type { PrismaLike } from '../upsert-node';

export type ProvisionStatus = 'failed' | 'provisioned' | 'updated';

export type ProvisionResult = {
  host: string;
  country: string;
  status: ProvisionStatus;
  error?: string;
  lostWireguardKeys?: boolean;
};

export type ProvisionHostInput = {
  config: NodeConfig;
  prisma: PrismaLike;
  serverEnvPath: string;
  xrayComposeContent: string;
};

export type PrepareHostInput = {
  ssh: SshClient;
  xrayComposeContent: string;
};

export type StartPanelInput = {
  ssh: SshClient;
  host: string;
  password: string;
  panelPath: string;
};

export type PanelSession = {
  baseUrl: string;
  token: string;
};

export type InstallInboundsInput = {
  ssh: SshClient;
  panel: PanelSession;
  auth: string;
};

export type InstalledInbounds = {
  wgPublicKey: string;
  wgWasGenerated: boolean;
};

export type RegisterNodeInput = {
  config: NodeConfig;
  prisma: PrismaLike;
  serverEnvPath: string;
  panel: PanelSession;
  password: string;
  panelPath: string;
  auth: string;
  wgPublicKey: string;
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
