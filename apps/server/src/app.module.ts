import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './core';
import { AuthModule } from './modules/auth/auth.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { TunnelModule } from './modules/tunnel/tunnel.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ttl: 60_000, limit: 120 }] }),
    AuthModule,
    SubscriptionModule,
    NodesModule,
    TunnelModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
