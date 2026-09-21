import { Controller, Delete, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { TelegramLinkCodeDto, TelegramStatusDto } from './dto';
import { TelegramLinkService } from './services';

@Controller('telegram')
export class TelegramLinkController {
  constructor(private readonly link: TelegramLinkService) {}

  @Get()
  @ZodResponse({ type: TelegramStatusDto })
  status(@CurrentUserId() userId: string) {
    return this.link.status(userId);
  }

  @Post('code')
  @ZodResponse({ type: TelegramLinkCodeDto })
  issueCode(@CurrentUserId() userId: string) {
    return this.link.issueCode(userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  unlink(@CurrentUserId() userId: string) {
    return this.link.unlink(userId);
  }
}
