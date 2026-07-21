import { Module } from '@nestjs/common';

import { PeersService } from './peers.service';

@Module({
  providers: [PeersService],
  exports: [PeersService],
})
export class PeersModule {}
