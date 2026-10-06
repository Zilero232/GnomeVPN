import { Injectable } from '@nestjs/common';
import { subHours } from 'date-fns';

import type { DeviceAddedInput, DeviceBlockedInput } from '../subscription-link.service.types';

import { PrismaService } from '../../../core';
import { deviceTitle } from '../../devices';
import { TelegramNotifyService } from '../../telegram/services/telegram-notify.service';
import { DEVICE_NOTICE } from '../config';

@Injectable()
export class FeedNoticeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: TelegramNotifyService
  ) {}

  async deviceAdded({ userId, identity, deviceCount, deviceLimit }: DeviceAddedInput): Promise<void> {
    await this.notify.tell({
      userId,
      pick: (copy) => copy.deviceAdded,
      fill: { name: deviceTitle(identity), count: String(deviceCount), limit: String(deviceLimit) }
    });
  }

  async deviceBlocked({ token, userId, identity, deviceLimit }: DeviceBlockedInput): Promise<void> {
    const now = new Date();

    const claimed = await this.prisma.subscriptionLink.updateMany({
      where: {
        token,
        OR: [
          { blockedKey: null },
          { blockedKey: { not: identity.key } },
          { blockedNoticeAt: { lt: subHours(now, DEVICE_NOTICE.blockedRepeatHours) } }
        ]
      },
      data: { blockedKey: identity.key, blockedNoticeAt: now }
    });

    if (claimed.count === 0) {
      return;
    }

    await this.notify.tell({
      userId,
      pick: (copy) => copy.deviceBlocked,
      fill: { name: deviceTitle(identity), limit: String(deviceLimit) }
    });
  }
}
