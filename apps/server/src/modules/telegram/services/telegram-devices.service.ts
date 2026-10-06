import { DEFAULT_DEVICE_LIMIT, EXTRA_DEVICE_PRICE_RUB, MAX_EXTRA_DEVICES } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard } from 'grammy';
import { isNullish } from 'remeda';

import type { BotContext, ExtraTextInput, RemovalInput } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { CheckoutService } from '../../billing';
import { DevicesService } from '../../devices';
import { SubscriptionService } from '../../subscription';
import { BOT_TEXT, CALLBACK_PREFIX, DEVICE_CHOICES, NEW_LINE } from '../config';
import { confirmKeyboard, countFrom, deviceAnswer, deviceLabel, deviceName, devicesText, fillText, parseDeviceId, removeDeviceCopy } from '../lib';
import { TelegramSharedService } from './telegram-shared.service';

@Injectable()
export class TelegramDevicesService {
  private readonly logger = new Logger(TelegramDevicesService.name);

  constructor(
    private readonly shared: TelegramSharedService,
    private readonly devices: DevicesService,
    private readonly subscription: SubscriptionService,
    private readonly checkout: CheckoutService
  ) {}

  async list(ctx: BotContext): Promise<void> {
    await this.shared.withUser({
      ctx,
      act: async (chat) => {
        const [list, status] = await Promise.all([this.devices.list(chat.userId), this.subscription.getStatus(chat.userId)]);
        const text = BOT_TEXT[chat.locale];
        const isAtMax = status.limits.deviceLimit - DEFAULT_DEVICE_LIMIT >= MAX_EXTRA_DEVICES;
        const keyboard = new InlineKeyboard();

        for (const [index, device] of list.devices.entries()) {
          const name = deviceLabel({ device, index, locale: chat.locale });

          keyboard.text(fillText({ text: text.deviceRemoveButton, fill: { name } }), `${CALLBACK_PREFIX.forgetDevice}${device.id}`).row();
        }

        if (!isAtMax) {
          for (const quantity of DEVICE_CHOICES) {
            keyboard.text(`+${quantity}`, `${CALLBACK_PREFIX.devices}${quantity}`);
          }
        }

        const body = devicesText({ list, locale: chat.locale });

        return ctx.reply([body, '', this.extraText({ copy: text, isAtMax })].join(NEW_LINE), { reply_markup: keyboard });
      }
    });
  }

  async askRemove(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.forgetDevice,
      act: async ({ chat, value }) => {
        const deviceId = parseDeviceId(value);

        if (isNullish(deviceId)) {
          return;
        }

        const text = BOT_TEXT[chat.locale];
        const { devices } = await this.devices.list(chat.userId);
        const device = devices.find((candidate) => candidate.id === deviceId);

        if (isNullish(device)) {
          return this.shared.reply({ ctx, chat, text: text.deviceGone });
        }

        const copy = removeDeviceCopy({ copy: text, name: deviceName({ device, locale: chat.locale }) });

        return ctx.reply(copy.ask, { reply_markup: confirmKeyboard({ copy, prefix: CALLBACK_PREFIX.removeDevice, subject: deviceId }) });
      }
    });
  }

  async confirmRemove(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.removeDevice,
      act: async ({ chat, value }) => {
        const answer = deviceAnswer(value);

        if (isNullish(answer)) {
          return;
        }

        const text = BOT_TEXT[chat.locale];

        if (!answer.isConfirmed) {
          return this.shared.reply({ ctx, chat, text: text.deviceKept });
        }

        const outcome = await this.removal({ userId: chat.userId, deviceId: answer.deviceId, copy: text });

        return this.shared.reply({ ctx, chat, text: outcome });
      }
    });
  }

  async buyDevices(ctx: BotContext): Promise<void> {
    await this.shared.answered({
      ctx,
      prefix: CALLBACK_PREFIX.devices,
      act: async ({ chat, value }) => {
        const quantity = countFrom({ raw: value, max: MAX_EXTRA_DEVICES });
        const text = BOT_TEXT[chat.locale];

        if (isNullish(quantity)) {
          return;
        }

        try {
          const { confirmationUrl } = await this.checkout.buyExtraDevices({ userId: chat.userId, quantity });

          await ctx.reply([text.devicesIntro, '', confirmationUrl].join(NEW_LINE));
        } catch (error) {
          this.logger.warn(`telegram extra devices failed: ${describeError(error)}`);

          await this.shared.reply({ ctx, chat, text: text.failed });
        }
      }
    });
  }

  private extraText({ copy, isAtMax }: ExtraTextInput): string {
    if (isAtMax) {
      return copy.devicesMax;
    }

    const price = fillText({ text: copy.devicesExtra, fill: { price: String(EXTRA_DEVICE_PRICE_RUB) } });

    return [price, copy.devicesChoose].join(NEW_LINE);
  }

  private async removal({ userId, deviceId, copy }: RemovalInput): Promise<string> {
    try {
      await this.devices.remove({ userId, deviceId });

      return copy.deviceRemoved;
    } catch (error) {
      if (errorCodeOf(error) === 'DEVICE_NOT_FOUND') {
        return copy.deviceGone;
      }

      throw error;
    }
  }
}
