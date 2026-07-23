import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../core';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;

    return { status: 'ok' };
  }
}
