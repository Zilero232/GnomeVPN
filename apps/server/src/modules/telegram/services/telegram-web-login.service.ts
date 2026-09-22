import type { TelegramWidget } from '@gnomevpn/schemas';

import { Injectable, Logger } from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { randomBytes } from 'node:crypto';
import { isNullish } from 'remeda';

import type { VerifyIdTokenInput } from '../lib';
import type { TelegramIdentity } from '../telegram.types';

import { AppBadRequestException, AppUnauthorizedException } from '../../../common/exceptions';
import { describeError } from '../../../common/lib';
import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../core';
import { IdentityService } from '../../auth';
import { WEB_LOGIN } from '../config';
import { botIdOf, verifyIdToken } from '../lib';
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
    return { clientId: botIdOf(this.config.get('TELEGRAM_BOT_TOKEN')) };
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

  async signInWithToken(idToken: string): Promise<string> {
    const clientId = botIdOf(this.config.get('TELEGRAM_BOT_TOKEN'));

    if (isNullish(clientId)) {
      throw new AppUnauthorizedException('TELEGRAM_WIDGET_INVALID', 'Telegram sign-in is not configured');
    }

    const identity = await this.identityFromToken({ idToken, clientId });
    const { userId } = await this.link.ensureChat(identity);

    return this.identity.issueSessionToken(userId);
  }

  private async identityFromToken(input: VerifyIdTokenInput): Promise<TelegramIdentity> {
    try {
      return await verifyIdToken(input);
    } catch (error) {
      this.logger.warn(`telegram id token rejected: ${describeError(error)}`);

      throw new AppUnauthorizedException('TELEGRAM_WIDGET_INVALID', 'The Telegram id token did not verify');
    }
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
