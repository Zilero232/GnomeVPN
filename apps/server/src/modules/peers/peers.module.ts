import { Module } from '@nestjs/common';

import { PeersService } from './services';

@Module({
  providers: [PeersService],
  exports: [PeersService],
})
export class PeersModule {}
