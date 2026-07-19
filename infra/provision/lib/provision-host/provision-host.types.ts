import type {
  PrismaLike,
  UpsertNodeInput,
  UpsertNodeResult,
} from '../../../../apps/server/scripts/lib/upsert-node';
import type { SshClient } from '../ssh-client';

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
