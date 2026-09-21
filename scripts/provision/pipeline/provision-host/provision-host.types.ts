import type { NodeConfig, PrismaLike } from '../../node';

export type ProvisionStatus = 'failed' | 'provisioned' | 'updated';

export type ProvisionResult = {
  host: string;
  country: string;
  status: ProvisionStatus;
  error?: string;
  lostRealityKeys?: boolean;
};

export type ProvisionHostInput = {
  config: NodeConfig;
  prisma: PrismaLike;
  serverEnvPath: string;
  xrayComposeContent: string;
};
