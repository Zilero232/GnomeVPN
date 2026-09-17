import { Module } from '@nestjs/common';

import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './services';

@Module({
  controllers: [PlatformsController],
  providers: [PlatformsService]
})
export class PlatformsModule {}
