import { Injectable, Logger } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import type {
  BuildFeedInput,
  FeedTarget,
  ServerUrisInput,
  SubscriptionBody,
  SubscriptionNode,
  TouchLinkInput
} from '../subscription-link.service.types';

import { AppNotFoundException } from '../../../common/exceptions';
import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config/config.module';
import { PrismaService } from '../../../core';
import { buildTunnelConfig } from '../../peers';
import { NODE_FEED_SELECT } from '../config';
import { clientPlatform, incyHeaders, incyServerUri } from '../lib';
import { SubscriptionPeersService } from './subscription-peers.service';

@Injectable()
export class SubscriptionFeedService {
  private readonly logger = new Logger(SubscriptionFeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionPeers: SubscriptionPeersService,
    private readonly config: AppConfigService
  ) {}

  async build({ token, userAgent }: BuildFeedInput): Promise<SubscriptionBody> {
    const link = await this.prisma.subscriptionLink.findUnique({
      where: { token },
      select: { userId: true, user: { select: { subscription: { select: { currentPeriodEnd: true } } } } }
    });

    if (!link) {
      throw new AppNotFoundException('SUBSCRIPTION_LINK_NOT_FOUND', 'Unknown subscription token');
    }

    void this.touch({ token, userAgent });

    const nodes = await this.availableNodes();
    const uris = await this.serverUris({ userId: link.userId, nodes });

    return {
      body: Buffer.from(uris.join('\n'), 'utf8').toString('base64'),
      headers: incyHeaders({
        currentPeriodEnd: link.user.subscription?.currentPeriodEnd ?? null,
        clientUrl: this.config.get('CLIENT_URL'),
        supportUrl: this.config.get('SUPPORT_URL') || null,
        announce: null
      })
    };
  }

  private async touch({ token, userAgent }: TouchLinkInput): Promise<void> {
    try {
      await this.prisma.subscriptionLink.update({
        where: { token },
        data: { lastSeenAt: new Date(), lastPlatform: clientPlatform(userAgent) }
      });
    } catch (error) {
      this.logger.warn(`subscription touch failed: ${describeError(error)}`);
    }
  }

  private availableNodes(): Promise<SubscriptionNode[]> {
    return this.prisma.node.findMany({
      where: { isAvailable: true },
      orderBy: { displayOrder: 'asc' },
      select: NODE_FEED_SELECT
    });
  }

  private async serverUris({ userId, nodes }: ServerUrisInput): Promise<string[]> {
    const targets: FeedTarget[] = nodes.flatMap((node) => this.subscriptionPeers.protocolsFor(node).map((protocol) => ({ node, protocol })));

    const issued = await Promise.all(targets.map(({ node, protocol }) => this.subscriptionPeers.ensure({ userId, node, protocol })));

    return targets
      .map(({ node, protocol }, index) => {
        const peer = issued[index];

        if (!peer) {
          return null;
        }

        const config = buildTunnelConfig({ node, protocol, auth: peer.nodeCredential });

        return incyServerUri({ config, country: node.country, countryCode: node.countryCode, city: node.city });
      })
      .filter(isNonNullish);
  }
}
