import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated';
import { validateEnv } from '../config/env.schema';

const env = validateEnv(process.env);

const globalForPrisma = globalThis as unknown as { basePrisma?: PrismaClient };

export const basePrisma =
  globalForPrisma.basePrisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

if (env.NODE_ENV === 'development') {
  globalForPrisma.basePrisma = basePrisma;
}
