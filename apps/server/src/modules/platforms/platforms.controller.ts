import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { PLATFORMS_CACHE_TTL_MS } from './config';
import { PlatformDto } from './dto/platforms.dto';
import { PlatformsService } from './services';

@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platforms: PlatformsService) {}

  @AllowAnonymous()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(PLATFORMS_CACHE_TTL_MS)
  @Get()
  @ZodResponse({ type: [PlatformDto] })
  list() {
    return this.platforms.list();
  }
}
