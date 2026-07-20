import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AllExceptionsFilter } from './common/filters';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './core';
import { AuthModule } from './modules/auth';
import { BillingModule } from './modules/billing';
import { HealthModule } from './modules/health';
import { NodesModule } from './modules/nodes';
import { ReleaseModule } from './modules/release';
import { SchedulerModule } from './modules/scheduler';
import { SubscriptionModule } from './modules/subscription';
import { TunnelModule } from './modules/tunnel';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }] }),
    AuthModule,
    HealthModule,
    SubscriptionModule,
    BillingModule,
    NodesModule,
    ReleaseModule,
    TunnelModule,
    SchedulerModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
