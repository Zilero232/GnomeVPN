import type { Response } from 'express';

import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { FEED } from './config';
import { SubscriptionFeedService } from './services';

@Controller('sub')
export class SubscriptionFeedController {
  constructor(private readonly feed: SubscriptionFeedService) {}

  @AllowAnonymous()
  @Get(':token')
  async serve(@Param('token') token: string, @Headers('user-agent') userAgent: string | undefined, @Res() res: Response): Promise<void> {
    const { body, headers } = await this.feed.build({ token, userAgent: userAgent ?? null });

    res.type(FEED.contentType).set(headers).send(body);
  }
}
