import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { SubscriptionGuard } from '../subscription';
import {
  ConnectDto,
  DeviceUsageDto,
  DisconnectDto,
  HeartbeatDto,
  TunnelConfigDto,
} from './dto/sessions.dto';
import { SessionConnectService } from './services';

@Controller('tunnel')
export class SessionsController {
  constructor(private readonly sessions: SessionConnectService) {}

  @Get('devices')
  @ZodResponse({ type: DeviceUsageDto })
  listDevices(@Query() query: DisconnectDto, @CurrentUserId() userId: string) {
    return this.sessions.listDevices({ userId, deviceId: query.deviceId });
  }

  @Post('connect')
  @UseGuards(SubscriptionGuard)
  @ZodResponse({ type: TunnelConfigDto })
  connect(@Body() body: ConnectDto, @CurrentUserId() userId: string) {
    return this.sessions.connect({
      userId,
      nodeId: body.nodeId,
      deviceId: body.deviceId,
      protocol: body.protocol,
    });
  }

  @Post('heartbeat')
  @HttpCode(204)
  async heartbeat(@Body() body: HeartbeatDto, @CurrentUserId() userId: string) {
    await this.sessions.heartbeat({ userId, deviceId: body.deviceId });
  }

  @Post('disconnect')
  @HttpCode(204)
  async disconnect(@Body() body: DisconnectDto, @CurrentUserId() userId: string) {
    await this.sessions.disconnect({ userId, deviceId: body.deviceId });
  }
}
