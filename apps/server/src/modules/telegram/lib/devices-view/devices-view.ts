import { EXTRA_DEVICE_PRICE_RUB, extraDevicesPriceRub } from '@gnomevpn/schemas';
import { InlineKeyboard } from 'grammy';

import type { BotMessage } from '../../telegram.types';
import type { DevicesViewInput } from './devices-view.types';

import { BOT_TEXT, CALLBACK_PREFIX, DEVICE_CHOICES } from '../../config';
import { deviceName, devicesText } from '../device-text';
import { fillLabel, fillText } from '../fill-text';
import { html } from '../html';

export const devicesView = ({ list, status, locale, notice }: DevicesViewInput): BotMessage => {
  const text = BOT_TEXT[locale];
  const isPaid = status.period === 'paid';
  const room = status.limits.maxExtraDevices - status.limits.extraDevices;
  const choices = DEVICE_CHOICES.filter((quantity) => quantity <= room);
  const isFull = choices.length === 0;
  const canAdd = isPaid && !isFull;
  const markup = new InlineKeyboard();

  for (const device of list.devices) {
    const label = fillLabel({ text: text.deviceRemoveButton, fill: { name: deviceName({ device, locale }) } });

    markup.text(label, `${CALLBACK_PREFIX.forgetDevice}${device.id}`).row();
  }

  if (isPaid && isFull) {
    markup.disabled(text.devicesFull);
  }

  if (canAdd) {
    for (const quantity of choices) {
      const label = fillLabel({ text: text.devicesBuy, fill: { count: String(quantity), price: String(extraDevicesPriceRub(quantity)) } });

      markup.text(label, `${CALLBACK_PREFIX.devices}${quantity}`).success();
    }
  }

  const offer = canAdd ? fillText({ text: text.devicesExtra, fill: { price: String(EXTRA_DEVICE_PRICE_RUB) } }) : null;

  return { text: html.paragraphs([notice, devicesText({ list, locale }), offer]), markup };
};
