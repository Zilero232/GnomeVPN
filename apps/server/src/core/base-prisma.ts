import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated';
import { validateEnv } from '../config/env.schema';

const env = validateEnv(process.env);

const globalForPrisma = globalThis as unknown as { basePrisma?: PrismaClient };

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  allowExitOnIdle: false,
});

export const basePrisma = globalForPrisma.basePrisma ?? new PrismaClient({ adapter });

if (env.NODE_ENV === 'development') {
  globalForPrisma.basePrisma = basePrisma;
}
