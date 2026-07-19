import { Controller, Get } from '@nestjs/common';
import { ZodResponse } from 'nestjs-zod';

import { ReleaseDto } from './dto/release.dto';
import { ReleaseService } from './release.service';

@Controller('release')
export class ReleaseController {
  constructor(private readonly release: ReleaseService) {}

  @Get('latest')
  @ZodResponse({ type: ReleaseDto })
  getLatest() {
    return this.release.getLatest();
  }
}
