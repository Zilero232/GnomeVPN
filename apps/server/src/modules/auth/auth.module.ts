import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';

import { auth } from '../../lib';

@Module({
  imports: [BetterAuthModule.forRoot({ auth, isGlobal: true })],
})
export class AuthModule {}
