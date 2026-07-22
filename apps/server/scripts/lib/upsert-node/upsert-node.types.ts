import type { basePrisma } from '../../../src/core';

export type PrismaLike = typeof basePrisma;

export type UpsertNodeInput = {
  country: string;
  countryCode: string;
  city?: string;
  host: string;
  port: number;
  realityServerName: string;
  realityPublicKey: string;
  realityShortId: string;
  apiUrl: string;
  apiTokenEnvVar: string;
};

export type UpsertNodeResult = {
  id: string;
  wasExisting: boolean;
};

export type UpsertNodeArgs = {
  prisma: PrismaLike;
  input: UpsertNodeInput;
};
