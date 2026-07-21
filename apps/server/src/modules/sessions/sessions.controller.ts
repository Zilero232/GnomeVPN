import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators';
import { SubscriptionGuard } from '../subscription';
import { ConnectDto, DisconnectDto, TunnelConfigDto } from './dto/sessions.dto';
import { SessionsService } from './sessions.service';

@Controller('tunnel')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post('connect')
  @UseGuards(SubscriptionGuard)
  @ZodResponse({ type: TunnelConfigDto })
  connect(@Body() body: ConnectDto, @CurrentUser() userId: string) {
    return this.sessions.connect({ userId, nodeId: body.nodeId, deviceId: body.deviceId });
  }

  @Post('disconnect')
  @HttpCode(204)
  async disconnect(@Body() body: DisconnectDto, @CurrentUser() userId: string) {
    await this.sessions.disconnect({ userId, deviceId: body.deviceId });
  }
}
