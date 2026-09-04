import type { Response } from 'express';

import { Body, Controller, Delete, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { SubscriptionGuard } from '../subscription';
import { CONFIG_FILE_CONTENT_TYPE } from './config';
import { contentDisposition } from './configs.helpers';
import { ConfigStatusDto, DownloadedConfigDto, IssueConfigDto, RevokeConfigDto } from './dto/configs.dto';
import { ConfigAccessService, ConfigIssueService } from './services';

@Controller('configs')
export class ConfigsController {
  constructor(
    private readonly configIssue: ConfigIssueService,
    private readonly configAccess: ConfigAccessService
  ) {}

  @Get()
  @ZodResponse({ type: [DownloadedConfigDto] })
  list(@CurrentUserId() userId: string) {
    return this.configIssue.list(userId);
  }

  @Get('status')
  @ZodResponse({ type: ConfigStatusDto })
  async status(@CurrentUserId() userId: string) {
    return { onlineIds: await this.configIssue.onlineIds(userId) };
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  async issue(@Body() body: IssueConfigDto, @CurrentUserId() userId: string, @Res() res: Response): Promise<void> {
    const file = await this.configIssue.issue({
      userId,
      nodeId: body.nodeId,
      name: body.name,
      protocol: body.protocol
    });

    res.type(CONFIG_FILE_CONTENT_TYPE).header('Content-Disposition', contentDisposition(file.fileName)).send(file.content);
  }

  @Delete()
  @HttpCode(204)
  async revoke(@Body() body: RevokeConfigDto, @CurrentUserId() userId: string) {
    await this.configAccess.revoke({ userId, id: body.id });
  }
}
