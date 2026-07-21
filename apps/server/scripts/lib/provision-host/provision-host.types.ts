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

export type WgEasyHealthCheck = (opts: { baseUrl: string; apiKey: string }) => Promise<boolean>;

export type UpsertNodeFn = (args: {
  prisma: PrismaLike;
  input: UpsertNodeInput;
}) => Promise<UpsertNodeResult>;

export type ProvisionHostOptions = {
  serverEnvPath: string;
  wgEasyComposeContent: string;
  createSshClient?: () => SshClient;
  healthCheck: WgEasyHealthCheck;
  upsertNode: UpsertNodeFn;
  basePrisma: PrismaLike;
  healthCheckTimeoutMs?: number;
  healthCheckIntervalMs?: number;
};

export type { UpsertNodeInput, UpsertNodeResult };

export type WaitForHealthyInput = {
  check: () => Promise<boolean>;
  timeoutMs: number;
  intervalMs: number;
};

export type ShipComposeStackInput = {
  ssh: SshClient;
  config: NodeConfig;
  composeContent: string;
  passwordHash: string;
};

export type RegisterPanelPasswordInput = {
  serverEnvPath: string;
  countryCode: string;
  password: string;
  isNew: boolean;
};

export type ProvisionHostInput = {
  config: NodeConfig;
  options: ProvisionHostOptions;
};
