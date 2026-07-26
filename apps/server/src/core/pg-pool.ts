import { Logger } from '@nestjs/common';
import { Pool } from 'pg';

import { validateEnv } from '../config/env.schema';

const env = validateEnv(process.env);

const logger = new Logger('PgPool');

const globalForPools = globalThis as unknown as { pgPools?: Pool[] };

if (env.NODE_ENV === 'development') {
  for (const stale of globalForPools.pgPools ?? []) {
    void stale.end().catch(() => {});
  }

  globalForPools.pgPools = [];
}

export const createPool = (connectionString: string): Pool => {
  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    maxLifetimeSeconds: 300,
    keepAlive: true,
    keepAliveInitialDelayMillis: 5_000,
    allowExitOnIdle: false,
  });

  pool.on('error', (error) => {
    logger.warn(`idle connection dropped: ${error.message}`);
  });

  if (env.NODE_ENV === 'development') {
    globalForPools.pgPools?.push(pool);
  }

  return pool;
};
