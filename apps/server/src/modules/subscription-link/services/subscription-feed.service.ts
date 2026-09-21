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
import { activeDeviceLimit, describeError, isPeriodActive } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../core';
import { NO_TRAFFIC } from '../../../lib/xray';
import { buildTunnelConfig } from '../../peers';
import { NODE_FEED_SELECT } from '../config';
import { announcement, clientPlatform, incyHeaders, incyServerUri, tlsMode } from '../lib';
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
      select: { userId: true, user: { select: { subscription: { select: { currentPeriodEnd: true, extraDevices: true } } } } }
    });

    if (!link) {
      throw new AppNotFoundException('SUBSCRIPTION_LINK_NOT_FOUND', 'Unknown subscription token');
    }

    void this.touch({ token, userAgent });

    const subscription = link.user.subscription;
    const currentPeriodEnd = subscription?.currentPeriodEnd ?? null;
    const hasAccess = isPeriodActive(currentPeriodEnd);
    const nodes = await this.availableNodes();

    const uris = hasAccess
      ? await this.serverUris({ userId: link.userId, nodes, limitIp: activeDeviceLimit(subscription), tls: tlsMode(userAgent) })
      : [];

    const traffic = hasAccess ? await this.subscriptionPeers.traffic({ userId: link.userId, nodes }) : NO_TRAFFIC;

    return {
      body: Buffer.from(uris.join('\n'), 'utf8').toString('base64'),
      headers: incyHeaders({
        currentPeriodEnd,
        traffic,
        clientUrl: this.config.get('CLIENT_URL'),
        supportUrl: this.config.get('SUPPORT_URL') || null,
        announce: announcement({ nodes, hasSubscription: isNonNullish(subscription), currentPeriodEnd })
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

  private async serverUris({ userId, nodes, limitIp, tls }: ServerUrisInput): Promise<string[]> {
    const targets: FeedTarget[] = nodes.flatMap((node) => this.subscriptionPeers.protocolsFor(node).map((protocol) => ({ node, protocol })));

    const issued = await Promise.all(targets.map(({ node, protocol }) => this.subscriptionPeers.ensure({ userId, node, protocol, limitIp })));

    return targets
      .map(({ node, protocol }, index) => {
        const peer = issued[index];

        if (!peer) {
          return null;
        }

        const config = buildTunnelConfig({ node, protocol, auth: peer.nodeCredential });

        return incyServerUri({ config, country: node.country, countryCode: node.countryCode, city: node.city, tls });
      })
      .filter(isNonNullish);
  }
}
