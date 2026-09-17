import type { SubscriptionLink } from '@gnomevpn/schemas';

import { encryptLink } from '@incy/link-encoder';
import { Injectable } from '@nestjs/common';

import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';
import { INCY_DEEP_LINK_NAME } from '../config';
import { generateSubscriptionToken } from '../lib';

@Injectable()
export class SubscriptionLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  async get(userId: string): Promise<SubscriptionLink> {
    const token = generateSubscriptionToken();

    const row = await this.prisma.subscriptionLink.upsert({
      where: { userId },
      update: {},
      create: { userId, token },
      select: { token: true, createdAt: true }
    });

    return this.present(row);
  }

  async rotate(userId: string): Promise<SubscriptionLink> {
    const token = generateSubscriptionToken();

    const row = await this.prisma.subscriptionLink.upsert({
      where: { userId },
      update: { token },
      create: { userId, token },
      select: { token: true, createdAt: true }
    });

    return this.present(row);
  }

  private present({ token, createdAt }: { token: string; createdAt: Date }): SubscriptionLink {
    const url = new URL(`/sub/${token}`, this.config.get('API_URL')).toString();

    return {
      url,
      deepLink: encryptLink(url, { name: INCY_DEEP_LINK_NAME }),
      createdAt: createdAt.toISOString()
    };
  }
}
