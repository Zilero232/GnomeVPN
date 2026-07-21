import { Module } from '@nestjs/common';

import { NodesModule } from '../nodes';
import { PeersModule } from '../peers';
import { SubscriptionModule } from '../subscription';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [NodesModule, PeersModule, SubscriptionModule],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
