import { Module } from '@nestjs/common';

import { DevicesController } from './devices.controller';
import { DevicesService } from './services';

@Module({
  controllers: [DevicesController],
  providers: [DevicesService],
  exports: [DevicesService]
})
export class DevicesModule {}
