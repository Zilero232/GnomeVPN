import { Body, Controller, Delete, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { SubscriptionGuard } from '../subscription';
import { CONFIG_FILE_CONTENT_TYPE } from './config';
import { DownloadedConfigDto, IssueConfigDto, RevokeConfigDto } from './dto/configs.dto';
import { contentDisposition } from './lib';
import { ConfigAccessService, ConfigIssueService } from './services';

import type { Response } from 'express';

@Controller('configs')
export class ConfigsController {
  constructor(
    private readonly configIssue: ConfigIssueService,
    private readonly configAccess: ConfigAccessService,
  ) {}

  @Get()
  @ZodResponse({ type: [DownloadedConfigDto] })
  list(@CurrentUserId() userId: string) {
    return this.configIssue.list(userId);
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  async issue(
    @Body() body: IssueConfigDto,
    @CurrentUserId() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.configIssue.issue({
      userId,
      nodeId: body.nodeId,
      name: body.name,
      protocol: body.protocol,
    });

    res
      .type(CONFIG_FILE_CONTENT_TYPE)
      .header('Content-Disposition', contentDisposition(file.fileName))
      .send(file.content);
  }

  @Delete()
  @HttpCode(204)
  async revoke(@Body() body: RevokeConfigDto, @CurrentUserId() userId: string) {
    await this.configAccess.revoke({ userId, id: body.id });
  }
}
