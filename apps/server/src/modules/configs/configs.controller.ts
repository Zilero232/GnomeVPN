import { Body, Controller, Delete, Get, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUser } from '../../common/decorators';
import { SubscriptionGuard } from '../subscription';
import { CONFIG_FILE_CONTENT_TYPE } from './config';
import { ConfigsService } from './configs.service';
import { DownloadedConfigDto, IssueConfigDto, RevokeConfigDto } from './dto/configs.dto';
import { contentDisposition } from './lib';

import type { Response } from 'express';

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configs: ConfigsService) {}

  @Get()
  @ZodResponse({ type: [DownloadedConfigDto] })
  list(@CurrentUser() userId: string) {
    return this.configs.list(userId);
  }

  @Post()
  @UseGuards(SubscriptionGuard)
  async issue(
    @Body() body: IssueConfigDto,
    @CurrentUser() userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const file = await this.configs.issue({ userId, nodeId: body.nodeId, name: body.name });

    res
      .type(CONFIG_FILE_CONTENT_TYPE)
      .header('Content-Disposition', contentDisposition(file.fileName))
      .send(file.content);
  }

  @Delete()
  @HttpCode(204)
  async revoke(@Body() body: RevokeConfigDto, @CurrentUser() userId: string) {
    await this.configs.revoke({ userId, id: body.id });
  }
}
