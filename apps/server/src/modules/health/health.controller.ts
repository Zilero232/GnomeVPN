import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

import { PrismaService } from '../../core';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @AllowAnonymous()
  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return { status: 'ok' };
  }
}
