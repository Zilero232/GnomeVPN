import type { InlineKeyboardButton } from 'grammy/types';

import { InlineKeyboard, Keyboard } from 'grammy';
import { isEmpty } from 'remeda';
import { match } from 'ts-pattern';

import type { BotLocale } from '../../telegram.types';
import type {
  ButtonKey,
  ChatState,
  KeyboardInput,
  KeyboardRow,
  KeyboardSlot,
  MenuButtonInput,
  MenuButtonsInput,
  OfferInput,
  VisibilityInput
} from './keyboard.types';

import {
  BOT_BUTTONS,
  BOT_TEXT,
  BUTTON_STYLE,
  CALLBACK_PREFIX,
  CURRENT_LANGUAGE_MARK,
  KEYBOARD_ROWS,
  LANGUAGE_BUTTONS,
  MORE_ROWS
} from '../../config';

const isVisible = ({ when, state }: VisibilityInput) =>
  match(when)
    .with('always', () => true)
    .with('subscribed', () => state.isSubscribed)
    .with('unsubscribed', () => !state.isSubscribed)
    .with('trialAvailable', () => state.isTrialAvailable)
    .exhaustive();

const visibleRows = (rows: KeyboardRow[], state: ChatState): KeyboardSlot[][] =>
  rows.map((row) => row.filter(({ when }) => isVisible({ when, state }))).filter((row) => !isEmpty(row));

const menuData = (key: ButtonKey): string => `${CALLBACK_PREFIX.menu}${key}`;

const menuButton = ({ locale, key }: MenuButtonInput): InlineKeyboardButton =>
  InlineKeyboard.text({ text: BOT_BUTTONS[locale][key], style: BUTTON_STYLE[key] }, menuData(key));

export const mainKeyboard = ({ locale, state }: KeyboardInput): Keyboard => {
  const rows = visibleRows(KEYBOARD_ROWS, state).map((row) => row.map(({ key }) => Keyboard.text(BOT_BUTTONS[locale][key], BUTTON_STYLE[key])));

  return Keyboard.from(rows).resized().persistent().placeholder(BOT_TEXT[locale].keyboardPlaceholder);
};

export const moreKeyboard = ({ locale, state }: KeyboardInput): InlineKeyboard =>
  InlineKeyboard.from(visibleRows(MORE_ROWS, state).map((row) => row.map(({ key }) => menuButton({ locale, key }))));

export const menuButtons = ({ locale, keys }: MenuButtonsInput): InlineKeyboard =>
  InlineKeyboard.from([keys.map((key) => menuButton({ locale, key }))]);

export const languageKeyboard = (current: BotLocale | undefined): InlineKeyboard =>
  InlineKeyboard.from([
    LANGUAGE_BUTTONS.map(({ locale, label }) =>
      InlineKeyboard.text(locale === current ? `${CURRENT_LANGUAGE_MARK} ${label}` : label, `${CALLBACK_PREFIX.locale}${locale}`)
    )
  ]);

export const offerKeys = ({ period, isTrialAvailable }: OfferInput): ButtonKey[] =>
  match({ period, isTrialAvailable })
    .returnType<ButtonKey[]>()
    .with({ period: 'paid' }, () => ['renew', 'autoRenew'])
    .with({ period: 'trial' }, () => ['renew'])
    .with({ isTrialAvailable: true }, () => ['trial', 'buy'])
    .otherwise(() => ['buy']);
