import { Controller, Get, Param, ParseIntPipe, Redirect } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ZodResponse } from 'nestjs-zod';

import { ReleaseDto } from './dto/release.dto';
import { ReleaseService } from './services';

@Controller('release')
export class ReleaseController {
  constructor(private readonly release: ReleaseService) {}

  @Get('latest')
  @AllowAnonymous()
  @ZodResponse({ type: ReleaseDto })
  getLatest() {
    return this.release.getLatest();
  }

  @Get('updater')
  @AllowAnonymous()
  getUpdaterManifest() {
    return this.release.getUpdaterManifest();
  }

  @Get('download/:assetId')
  @AllowAnonymous()
  @Redirect()
  async download(@Param('assetId', ParseIntPipe) assetId: number) {
    return { url: await this.release.resolveAssetUrl(assetId), statusCode: 302 };
  }
}
