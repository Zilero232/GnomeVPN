import { Module } from '@nestjs/common';

import { EventsController } from './events.controller';
import { EventsService } from './services';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService]
})
export class EventsModule {}
