import { InlineKeyboard } from 'grammy';
import { match } from 'ts-pattern';

import type { BotMessage } from '../../telegram.types';
import type { AutoRenewPanelInput } from './auto-renew-panel.types';

import { AUTO_RENEW_CHOICE, BOT_TEXT, CALLBACK_PREFIX } from '../../config';
import { fillText } from '../fill-text';
import { formatDate } from '../format-date';
import { menuButtons, offerKeys } from '../keyboard';

export const autoRenewPanel = ({ status, locale }: AutoRenewPanelInput): BotMessage => {
  const text = BOT_TEXT[locale];

  return match(status)
    .returnType<BotMessage>()
    .with({ period: 'none' }, () => ({
      text: text.inactive,
      markup: menuButtons({ locale, keys: offerKeys(status) })
    }))
    .with({ period: 'trial' }, () => ({
      text: text.autoRenewTrial,
      markup: menuButtons({ locale, keys: ['renew'] })
    }))
    .with({ isRecurringAvailable: false }, () => ({
      text: text.autoRenewUnavailable,
      markup: menuButtons({ locale, keys: ['renew'] })
    }))
    .with({ cancelAtPeriodEnd: true, hasPaymentMethod: false }, () => ({
      text: text.autoRenewNeedsCard,
      markup: menuButtons({ locale, keys: ['website'] })
    }))
    .with({ cancelAtPeriodEnd: true }, ({ currentPeriodEnd }) => ({
      text: fillText({ text: text.autoRenewOff, fill: { date: formatDate({ iso: currentPeriodEnd, locale }) } }),
      markup: new InlineKeyboard().text(text.autoRenewEnable, `${CALLBACK_PREFIX.autoRenew}${AUTO_RENEW_CHOICE.on}`).success()
    }))
    .otherwise(() => ({
      text: text.autoRenewOn,
      markup: new InlineKeyboard().text(text.autoRenewDisable, `${CALLBACK_PREFIX.autoRenew}${AUTO_RENEW_CHOICE.off}`).danger()
    }));
};
