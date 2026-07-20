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

export type UpsertNodeFn = (
  prisma: PrismaLike,
  input: UpsertNodeInput,
) => Promise<UpsertNodeResult>;

export type ProvisionHostOptions = {
  backendIp?: string;
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
