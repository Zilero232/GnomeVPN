import type { SubscriptionLink } from '@gnomevpn/schemas';

import { encryptLink } from '@incy/link-encoder';
import { Injectable } from '@nestjs/common';

import type { PresentLinkInput, UpsertLinkInput } from '../subscription-link.service.types';

import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../core';
import { FEED } from '../config';
import { clientLinks, generateSubscriptionToken } from '../lib';

@Injectable()
export class SubscriptionLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  async get(userId: string): Promise<SubscriptionLink> {
    return this.upsert({ userId, replaceToken: false });
  }

  async rotate(userId: string): Promise<SubscriptionLink> {
    return this.upsert({ userId, replaceToken: true });
  }

  private async upsert({ userId, replaceToken }: UpsertLinkInput): Promise<SubscriptionLink> {
    const token = generateSubscriptionToken();

    const row = await this.prisma.subscriptionLink.upsert({
      where: { userId },
      update: replaceToken ? { token } : {},
      create: { userId, token },
      select: { token: true, createdAt: true }
    });

    return this.present(row);
  }

  private present({ token, createdAt }: PresentLinkInput): SubscriptionLink {
    const url = new URL(`${FEED.path}/${token}`, this.config.get('API_URL')).toString();
    const deepLink = encryptLink(url, { name: FEED.deepLinkName });

    return {
      url,
      deepLink,
      clients: clientLinks({ url, deepLink }),
      createdAt: createdAt.toISOString()
    };
  }
}
