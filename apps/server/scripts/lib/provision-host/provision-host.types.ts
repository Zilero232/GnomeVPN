import type { NodeConfig } from '../nodes-config';
import type { SshClient } from '../ssh-client';
import type { PrismaLike, UpsertNodeInput, UpsertNodeResult } from '../upsert-node';

export type ProvisionStatus = 'provisioned' | 'updated' | 'failed';

export type ProvisionResult = {
  host: string;
  country: string;
  status: ProvisionStatus;
  error?: string;
};

export type PanelHealthCheck = (opts: { baseUrl: string; token: string }) => Promise<boolean>;

export type EnsureInboundFn = (opts: {
  baseUrl: string;
  token: string;
  inbound: Record<string, unknown>;
}) => Promise<void>;

export type UpsertNodeFn = (args: {
  prisma: PrismaLike;
  input: UpsertNodeInput;
}) => Promise<UpsertNodeResult>;

export type ProvisionHostOptions = {
  serverEnvPath: string;
  xrayComposeContent: string;
  createSshClient?: () => SshClient;
  healthCheck: PanelHealthCheck;
  ensureInbound: EnsureInboundFn;
  upsertNode: UpsertNodeFn;
  basePrisma: PrismaLike;
  healthCheckTimeoutMs?: number;
  healthCheckIntervalMs?: number;
};

export type RememberNodeSecretsInput = {
  serverEnvPath: string;
  countryCode: string;
  apiToken: string;
  panelPassword: string;
};

export type ProvisionHostInput = {
  config: NodeConfig;
  options: ProvisionHostOptions;
};

export type { UpsertNodeInput, UpsertNodeResult };
