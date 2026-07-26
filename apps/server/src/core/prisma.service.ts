import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../generated';
import { validateEnv } from '../config/env.schema';

const env = validateEnv(process.env);

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
        keepAlive: true,
        allowExitOnIdle: false,
      }),
      log: env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
