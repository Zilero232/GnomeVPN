import type { TelegramStatus } from '@gnomevpn/schemas';

import { Injectable } from '@nestjs/common';
import { addMinutes } from 'date-fns';

import type { ConsumeLinkCodeInput, IssueLinkCodeResult, LinkedAccount, ResolvedChat, SetLocaleInput, TelegramIdentity } from '../telegram.types';

import { AppBadRequestException } from '../../../common/exceptions';
import { AppConfigService } from '../../../config';
import { PrismaService } from '../../../core';
import { LINK_CODE } from '../config';
import { generateLinkCode, normaliseLinkCode, resolveLocale } from '../lib';

@Injectable()
export class TelegramLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService
  ) {}

  async issueCode(userId: string): Promise<IssueLinkCodeResult> {
    const code = generateLinkCode();
    const expiresAt = addMinutes(new Date(), LINK_CODE.ttlMinutes);

    await this.prisma.$transaction([
      this.prisma.telegramLinkCode.deleteMany({ where: { userId } }),
      this.prisma.telegramLinkCode.create({ data: { code, userId, expiresAt } })
    ]);

    return {
      code,
      expiresAt: expiresAt.toISOString(),
      botUsername: this.config.get('TELEGRAM_BOT_USERNAME')
    };
  }

  async consumeCode({ code, telegramId, username, languageCode }: ConsumeLinkCodeInput): Promise<LinkedAccount> {
    const normalised = normaliseLinkCode(code);

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.telegramLinkCode.updateMany({
        where: { code: normalised, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() }
      });

      if (claimed.count === 0) {
        throw new AppBadRequestException('TELEGRAM_CODE_INVALID', 'The code is unknown, already used or expired');
      }

      const { userId } = await tx.telegramLinkCode.findUniqueOrThrow({
        where: { code: normalised },
        select: { userId: true }
      });

      const taken = await tx.telegramAccount.findUnique({
        where: { telegramId },
        select: { userId: true }
      });

      if (taken && taken.userId !== userId) {
        throw new AppBadRequestException('TELEGRAM_ALREADY_LINKED', 'This Telegram account is linked to another subscription');
      }

      await tx.telegramAccount.deleteMany({ where: { userId, telegramId: { not: telegramId } } });

      await tx.telegramAccount.upsert({
        where: { telegramId },
        update: { userId, username, languageCode },
        create: { userId, telegramId, username, languageCode }
      });

      return { userId, telegramId, username };
    });
  }

  async findChat(telegramId: bigint): Promise<ResolvedChat | null> {
    const row = await this.prisma.telegramAccount.findUnique({
      where: { telegramId },
      select: { userId: true, locale: true, languageCode: true }
    });

    if (!row) {
      return null;
    }

    return { userId: row.userId, telegramId, locale: resolveLocale(row.locale ?? row.languageCode) };
  }

  async findUserId(telegramId: bigint): Promise<string | null> {
    const row = await this.prisma.telegramAccount.findUnique({
      where: { telegramId },
      select: { userId: true }
    });

    return row?.userId ?? null;
  }

  async setLocale({ telegramId, locale }: SetLocaleInput): Promise<void> {
    await this.prisma.telegramAccount.updateMany({ where: { telegramId }, data: { locale } });
  }

  async status(userId: string): Promise<TelegramStatus> {
    const row = await this.prisma.telegramAccount.findUnique({
      where: { userId },
      select: { username: true }
    });

    return {
      isLinked: Boolean(row),
      username: row?.username ?? null,
      botUsername: this.config.get('TELEGRAM_BOT_USERNAME')
    };
  }

  async unlink(userId: string): Promise<void> {
    await this.prisma.telegramAccount.deleteMany({ where: { userId } });
  }

  async touch({ telegramId, username, languageCode }: TelegramIdentity): Promise<void> {
    await this.prisma.telegramAccount.updateMany({
      where: { telegramId },
      data: { lastSeenAt: new Date(), username, languageCode }
    });
  }
}
