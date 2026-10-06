import type { Request, Response } from 'express';

import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { FEED } from './config';
import { SubscriptionFeedService } from './services';

@Controller('sub')
export class SubscriptionFeedController {
  constructor(private readonly feed: SubscriptionFeedService) {}

  @AllowAnonymous()
  @Throttle({ default: FEED.throttle })
  @Get(':token')
  async serve(@Param('token') token: string, @Req() req: Request, @Res() res: Response): Promise<void> {
    const { body, headers } = await this.feed.build({ token, headers: req.headers });

    res
      .type(FEED.contentType)
      .set({ ...headers, 'cache-control': FEED.cacheControl })
      .send(body);
  }
}
