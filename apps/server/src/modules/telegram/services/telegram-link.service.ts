import type { TelegramStatus } from '@gnomevpn/schemas';

import { isPlaceholderEmail } from '@gnomevpn/schemas';
import { Injectable } from '@nestjs/common';
import { addMinutes } from 'date-fns';
import { isNonNullish, isNullish } from 'remeda';

import type {
  ConsumeLinkCodeInput,
  IssueLinkCodeResult,
  LinkedAccount,
  ResolvedChat,
  SetLocaleInput,
  TelegramIdentity,
  UntouchedUserInput
} from '../telegram.types';

import { AppBadRequestException, AppServiceUnavailableException } from '../../../common/exceptions';
import { AppConfigService } from '../../../config';
import { isPrismaRequestError, PrismaService, UNIQUE_VIOLATION } from '../../../core';
import { IdentityService } from '../../auth';
import { LINK_CODE } from '../config';
import { generateLinkCode, normaliseLinkCode, resolveLocale } from '../lib';

@Injectable()
export class TelegramLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly identity: IdentityService
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

      const heldByAnother = isNonNullish(taken) && taken.userId !== userId;
      const heldByEmptyChat = heldByAnother && (await this.isUntouchedTelegramUser({ tx, userId: taken.userId }));

      if (heldByAnother && !heldByEmptyChat) {
        throw new AppBadRequestException('TELEGRAM_ALREADY_LINKED', 'This Telegram account is linked to another subscription');
      }

      await tx.telegramAccount.deleteMany({ where: { userId, telegramId: { not: telegramId } } });

      if (heldByEmptyChat && isNonNullish(taken)) {
        await tx.user.delete({ where: { id: taken.userId } });
      }

      await tx.telegramAccount.upsert({
        where: { telegramId },
        update: { userId, username, languageCode },
        create: { userId, telegramId, username, languageCode }
      });

      return { userId, telegramId, username };
    });
  }

  private async isUntouchedTelegramUser({ tx, userId }: UntouchedUserInput): Promise<boolean> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { email: true, subscription: { select: { currentPeriodEnd: true, trialStartedAt: true } } }
    });

    if (isNullish(user) || !isPlaceholderEmail(user.email)) {
      return false;
    }

    return isNullish(user.subscription?.trialStartedAt) && isNullish(user.subscription?.currentPeriodEnd);
  }

  async ensureChat(identity: TelegramIdentity): Promise<ResolvedChat> {
    const existing = await this.findChat(identity.telegramId);

    if (isNonNullish(existing)) {
      return existing;
    }

    const { telegramId, username, languageCode } = identity;
    const userId = await this.identity.createFromTelegram({ telegramId, username });

    try {
      await this.prisma.telegramAccount.create({ data: { userId, telegramId, username, languageCode } });
    } catch (error) {
      if (!isPrismaRequestError(error) || error.code !== UNIQUE_VIOLATION) {
        throw error;
      }

      await this.identity.deleteUser(userId);

      return this.findChatOrThrow(telegramId);
    }

    return this.findChatOrThrow(telegramId);
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
    if (!(await this.identity.hasRealEmail(userId))) {
      throw new AppBadRequestException('TELEGRAM_LAST_SIGN_IN', 'Telegram is the only way into this account');
    }

    await this.prisma.telegramAccount.deleteMany({ where: { userId } });
  }

  private async findChatOrThrow(telegramId: bigint): Promise<ResolvedChat> {
    const chat = await this.findChat(telegramId);

    if (isNullish(chat)) {
      throw new AppServiceUnavailableException('INTERNAL_ERROR', 'The Telegram chat could not be registered');
    }

    return chat;
  }

  async touch({ telegramId, username, languageCode }: TelegramIdentity): Promise<void> {
    await this.prisma.telegramAccount.updateMany({
      where: { telegramId },
      data: { lastSeenAt: new Date(), username, languageCode }
    });
  }
}
