import { extraDevicesPriceRub, MAX_EXTRA_DEVICES } from '@gnomevpn/schemas';
import { Injectable, Logger } from '@nestjs/common';
import { isNullish } from 'remeda';

import type { BotContext, BotMessage, DevicesViewInput, RemovalInput } from '../telegram.types';

import { describeError, errorCodeOf } from '../../../common/lib';
import { CheckoutService } from '../../billing';
import { DevicesService } from '../../devices';
import { SubscriptionService } from '../../subscription';
import { BOT_TEXT, CALLBACK_PREFIX } from '../config';
import {
  confirmKeyboard,
  countFrom,
  deviceAnswer,
  deviceName,
  devicesView,
  fillLabel,
  fillText,
  parseDeviceId,
  removeDeviceCopy,
  urlMessage
} from '../lib';
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
      act: async (chat) => this.shared.reply({ ctx, chat, ...(await this.view({ chat })) })
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

        const list = await this.devices.list(chat.userId);
        const device = list.devices.find((candidate) => candidate.id === deviceId);

        if (isNullish(device)) {
          return this.shared.edit({ ctx, ...(await this.view({ chat, list, notice: BOT_TEXT[chat.locale].deviceGone })) });
        }

        const copy = removeDeviceCopy({ copy: BOT_TEXT[chat.locale], name: deviceName({ device, locale: chat.locale }) });

        return this.shared.edit({ ctx, text: copy.ask, markup: confirmKeyboard({ copy, prefix: CALLBACK_PREFIX.removeDevice, subject: deviceId }) });
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
        const notice = answer.isConfirmed ? await this.removal({ userId: chat.userId, deviceId: answer.deviceId, copy: text }) : text.deviceKept;

        return this.shared.edit({ ctx, ...(await this.view({ chat, notice })) });
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

        this.shared.typing(ctx);

        try {
          const { confirmationUrl } = await this.checkout.buyExtraDevices({ userId: chat.userId, quantity });
          const amount = String(extraDevicesPriceRub(quantity));
          const intro = fillText({ text: text.devicesIntro, fill: { count: String(quantity), amount } });
          const label = fillLabel({ text: text.checkoutButton, fill: { amount } });

          return this.shared.reply({ ctx, chat, ...urlMessage({ intro, url: confirmationUrl, label, style: 'success' }) });
        } catch (error) {
          if (errorCodeOf(error) === 'EXTRA_DEVICES_LIMIT') {
            return this.shared.reply({ ctx, chat, text: text.devicesFull });
          }

          this.logger.warn(`telegram extra devices failed: ${describeError(error)}`);

          return this.shared.reply({ ctx, chat, text: text.failed });
        }
      }
    });
  }

  private async view({ chat, list, notice }: DevicesViewInput): Promise<BotMessage> {
    const [devices, status] = await Promise.all([list ?? this.devices.list(chat.userId), this.subscription.getStatus(chat.userId)]);

    return devicesView({ list: devices, status, locale: chat.locale, notice });
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
