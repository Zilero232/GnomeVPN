import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated';
import { validateEnv } from '../config/env.schema';
import { createPool } from './pg-pool';

const env = validateEnv(process.env);

const globalForPrisma = globalThis as unknown as { basePrisma?: PrismaClient };

const createBasePrisma = (): PrismaClient =>
  new PrismaClient({ adapter: new PrismaPg(createPool(env.DATABASE_URL)) });

export const basePrisma = globalForPrisma.basePrisma ?? createBasePrisma();

if (env.NODE_ENV === 'development') {
  globalForPrisma.basePrisma = basePrisma;
}
