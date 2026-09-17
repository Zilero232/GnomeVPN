import type { SubscriptionLink } from '@gnomevpn/schemas';

import { encryptLink } from '@incy/link-encoder';
import { Injectable } from '@nestjs/common';

import type { PresentLinkInput, UpsertLinkInput } from '../subscription-link.service.types';

import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';
import { INCY_DEEP_LINK_NAME, SUBSCRIPTION_PATH } from '../config';
import { generateSubscriptionToken } from '../lib';

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
    const url = new URL(`${SUBSCRIPTION_PATH}/${token}`, this.config.get('API_URL')).toString();

    return {
      url,
      deepLink: encryptLink(url, { name: INCY_DEEP_LINK_NAME }),
      createdAt: createdAt.toISOString()
    };
  }
}
