import { Controller, Get, Post } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { CurrentUserId } from '../../common/decorators';
import { SubscriptionLinkDto } from './dto/subscription-link.dto';
import { SubscriptionLinkService } from './services';

@Controller('subscription-link')
export class SubscriptionLinkController {
  constructor(private readonly link: SubscriptionLinkService) {}

  @Get()
  @ZodResponse({ type: SubscriptionLinkDto })
  get(@CurrentUserId() userId: string) {
    return this.link.get(userId);
  }

  @Post('rotate')
  @ZodResponse({ type: SubscriptionLinkDto })
  rotate(@CurrentUserId() userId: string) {
    return this.link.rotate(userId);
  }
}
