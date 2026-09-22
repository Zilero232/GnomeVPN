import type { TelegramWidget } from '@gnomevpn/schemas';

import { Injectable, Logger } from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'node:crypto';
import { isNullish } from 'remeda';

import type { WidgetPayload } from '../lib';

import { AppBadRequestException, AppUnauthorizedException } from '../../../common/exceptions';
import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../core';
import { IdentityService } from '../../auth';
import { WEB_LOGIN } from '../config';
import { verifyWidgetPayload, widgetIdentity } from '../lib';
import { TelegramLinkService } from './telegram-link.service';

@Injectable()
export class TelegramWebLoginService {
  private readonly logger = new Logger(TelegramWebLoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly identity: IdentityService,
    private readonly link: TelegramLinkService
  ) {}

  widget(): TelegramWidget {
    return { botUsername: this.config.get('TELEGRAM_BOT_USERNAME') };
  }

  async issue(userId: string): Promise<string> {
    const code = randomBytes(WEB_LOGIN.bytes).toString('base64url');
    const expiresAt = addMinutes(new Date(), WEB_LOGIN.ttlMinutes);

    await this.prisma.$transaction([
      this.prisma.telegramWebLogin.deleteMany({ where: { userId } }),
      this.prisma.telegramWebLogin.create({ data: { code, userId, expiresAt } })
    ]);

    const url = new URL(WEB_LOGIN.path, this.config.get('CLIENT_URL'));

    url.searchParams.set('code', code);

    return url.toString();
  }

  async signInWithWidget(payload: WidgetPayload): Promise<string> {
    const botToken = this.config.get('TELEGRAM_BOT_TOKEN');
    const identity = widgetIdentity(payload);

    if (!botToken || !verifyWidgetPayload({ payload, botToken }) || isNullish(identity)) {
      this.logger.warn('a telegram widget payload did not verify');

      throw new AppUnauthorizedException('TELEGRAM_WIDGET_INVALID', 'The Telegram sign-in payload is not signed by our bot');
    }

    const { userId } = await this.link.ensureChat(identity);

    return this.identity.issueSessionToken(userId);
  }

  async redeem(code: string): Promise<string> {
    const claimed = await this.prisma.telegramWebLogin.updateMany({
      where: { code, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() }
    });

    if (claimed.count === 0) {
      throw new AppBadRequestException('TELEGRAM_CODE_INVALID', 'The sign-in link is unknown, already used or expired');
    }

    const { userId } = await this.prisma.telegramWebLogin.findUniqueOrThrow({
      where: { code },
      select: { userId: true }
    });

    return this.identity.issueSessionToken(userId);
  }
}
