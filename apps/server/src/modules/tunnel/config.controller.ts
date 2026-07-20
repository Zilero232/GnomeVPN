import { Body, Controller, Delete, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators';
import { SubscriptionGuard } from '../subscription';
import { DownloadedConfigDto, IssueConfigDto, RevokeConfigDto } from './dto/tunnel.dto';
import { TunnelService } from './tunnel.service';

import type { Response } from 'express';

@Controller('configs')
export class ConfigController {
  constructor(private readonly tunnel: TunnelService) {}

  @Get()
  @ZodResponse({ type: [DownloadedConfigDto] })
  listConfigs(@CurrentUser() userId: string) {
    return this.tunnel.listConfigs(userId);
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  async issueConfig(
    @Body() body: IssueConfigDto,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.tunnel.issueConfig({ userId, nodeId: body.nodeId, name: body.name });

    res
      .type('text/plain; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${file.fileName}"`)
      .send(file.content);
  }

  @Delete()
  @HttpCode(204)
  async revokeConfig(@Body() body: RevokeConfigDto, @CurrentUser() userId: string) {
    await this.tunnel.revokeConfig(userId, body.id);
  }
}
