import { Module } from '@nestjs/common';

import { ReleaseController } from './release.controller';
import { ReleaseService } from './services';

@Module({
  controllers: [ReleaseController],
  providers: [ReleaseService],
})
export class ReleaseModule {}
