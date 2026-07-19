import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../core';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    // A reachable process is not enough: without the database the API answers
    // every request with an error, so the container must report itself
    // unhealthy and let the orchestrator restart or hold traffic.
    await this.prisma.$queryRaw`SELECT 1`;

    return { status: 'ok' };
  }
}
