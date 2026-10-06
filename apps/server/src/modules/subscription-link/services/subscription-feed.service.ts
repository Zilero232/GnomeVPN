import { Injectable, Logger } from '@nestjs/common';
import { isNonNullish } from 'remeda';

import type { BuildFeedInput, ServerUrisInput, SubscriptionBody, SubscriptionNode, TouchLinkInput } from '../subscription-link.service.types';

import { AppNotFoundException } from '../../../common/exceptions';
import { activeDeviceLimit, describeError, isPeriodActive } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../core';
import { NO_TRAFFIC } from '../../../lib/xray';
import { DEVICE_HEADER, deviceIdentity, DevicesService, headerOf } from '../../devices';
import { buildTunnelConfig } from '../../peers';
import { NODE_FEED_SELECT } from '../config';
import { announcement, clientPlatform, incyHeaders, incyServerUri, tlsMode } from '../lib';
import { FeedNoticeService } from './feed-notice.service';
import { SubscriptionPeersService } from './subscription-peers.service';

@Injectable()
export class SubscriptionFeedService {
  private readonly logger = new Logger(SubscriptionFeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionPeers: SubscriptionPeersService,
    private readonly devices: DevicesService,
    private readonly notice: FeedNoticeService,
    private readonly config: AppConfigService
  ) {}

  async build({ token, headers }: BuildFeedInput): Promise<SubscriptionBody> {
    const link = await this.prisma.subscriptionLink.findUnique({
      where: { token },
      select: { userId: true, user: { select: { subscription: { select: { currentPeriodEnd: true, extraDevices: true } } } } }
    });

    if (!link) {
      throw new AppNotFoundException('SUBSCRIPTION_LINK_NOT_FOUND', 'Unknown subscription token');
    }

    const identity = deviceIdentity(headers);
    const userAgent = headerOf({ headers, name: DEVICE_HEADER.userAgent });

    void this.touch({ token, userAgent });

    const subscription = link.user.subscription;
    const currentPeriodEnd = subscription?.currentPeriodEnd ?? null;
    const hasAccess = isPeriodActive(currentPeriodEnd);
    const deviceLimit = activeDeviceLimit(subscription);
    const nodes = await this.availableNodes();

    const admitted = hasAccess ? await this.devices.admit({ userId: link.userId, identity, deviceLimit }) : null;
    const deviceId = admitted?.isAllowed ? admitted.deviceId : null;

    if (admitted?.isNew) {
      void this.notice.deviceAdded({ userId: link.userId, identity, deviceCount: admitted.deviceCount, deviceLimit });
    }

    if (admitted && !admitted.isAllowed) {
      void this.notice.deviceBlocked({ token, userId: link.userId, identity, deviceLimit }).catch((error: unknown) => {
        this.logger.warn(`device-limit notice failed: ${describeError(error)}`);
      });
    }

    const uris = isNonNullish(deviceId) ? await this.serverUris({ userId: link.userId, deviceId, nodes, tls: tlsMode(userAgent) }) : [];

    const traffic = hasAccess ? await this.subscriptionPeers.traffic({ userId: link.userId, nodes }) : NO_TRAFFIC;

    return {
      body: Buffer.from(uris.join('\n'), 'utf8').toString('base64'),
      headers: incyHeaders({
        currentPeriodEnd,
        traffic,
        clientUrl: this.config.get('CLIENT_URL'),
        supportUrl: this.config.get('SUPPORT_URL') || null,
        announce: announcement({
          nodes,
          hasSubscription: isNonNullish(subscription),
          currentPeriodEnd,
          blockedAtLimit: admitted && !admitted.isAllowed ? deviceLimit : null
        })
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

  private async serverUris({ userId, deviceId, nodes, tls }: ServerUrisInput): Promise<string[]> {
    const issued = await Promise.all(nodes.map((node) => this.subscriptionPeers.ensureNode({ userId, deviceId, node })));

    return nodes
      .flatMap((node, index) =>
        this.subscriptionPeers.protocolsFor(node).map((protocol) => {
          const peer = issued[index].find((candidate) => candidate.protocol === protocol);

          if (!peer) {
            return null;
          }

          const config = buildTunnelConfig({ node, protocol, auth: peer.nodeCredential });

          return incyServerUri({ config, country: node.country, countryCode: node.countryCode, city: node.city, tls });
        })
      )
      .filter(isNonNullish);
  }
}
