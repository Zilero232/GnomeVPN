import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubscriptionGuard } from '../subscription/subscription.guard';
import { ConnectDto, TunnelConfigDto } from './dto/tunnel.dto';
import { TunnelService } from './tunnel.service';

@Controller('tunnel')
export class TunnelController {
  constructor(private readonly tunnel: TunnelService) {}

  @Post('connect')
  @UseGuards(SubscriptionGuard)
  @ZodResponse({ type: TunnelConfigDto })
  connect(@Body() body: ConnectDto, @CurrentUser() userId: string) {
    return this.tunnel.connect(userId, body.nodeId);
  }

  @Post('disconnect')
  @HttpCode(204)
  async disconnect(@CurrentUser() userId: string) {
    await this.tunnel.disconnect(userId);
  }
}
