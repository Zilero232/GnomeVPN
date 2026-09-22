import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from '../../lib';
import { PeersModule } from '../peers';
import { AccountController } from './account.controller';
import { AccountService, IdentityService } from './services';

@Module({
  imports: [BetterAuthModule.forRoot({ auth, isGlobal: true }), PeersModule],
  controllers: [AccountController],
  providers: [AccountService, IdentityService],
  exports: [AccountService, IdentityService]
})
export class AuthModule {}
