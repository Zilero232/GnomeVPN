import { Module } from '@nestjs/common';

import { NodesModule } from '../nodes';
import { PeersModule } from '../peers';
import { SubscriptionModule } from '../subscription';
import { SessionAccessService, SessionConnectService } from './services';
import { SessionsController } from './sessions.controller';

@Module({
  imports: [NodesModule, PeersModule, SubscriptionModule],
  controllers: [SessionsController],
  providers: [SessionConnectService, SessionAccessService],
  exports: [SessionAccessService]
})
export class SessionsModule {}
