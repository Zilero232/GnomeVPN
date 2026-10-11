import type { PeriodKind } from '@gnomevpn/schemas';
import type { KeyboardButton } from 'grammy/types';

import type { BotButtons, BotLocale } from '../../telegram.types';

export type ButtonKey = keyof BotButtons;

export type ButtonStyle = NonNullable<KeyboardButton.CommonButton['style']>;

export type ButtonVisibility = 'always' | 'subscribed' | 'trialAvailable' | 'unsubscribed';

export type ChatState = {
  isSubscribed: boolean;
  isTrialAvailable: boolean;
};

export type KeyboardSlot = {
  key: ButtonKey;
  when: ButtonVisibility;
};

export type KeyboardRow = KeyboardSlot[];

export type VisibilityInput = {
  when: ButtonVisibility;
  state: ChatState;
};

export type KeyboardInput = {
  locale: BotLocale;
  state: ChatState;
};

export type MenuButtonsInput = {
  locale: BotLocale;
  keys: readonly ButtonKey[];
};

export type MenuButtonInput = {
  locale: BotLocale;
  key: ButtonKey;
};

export type OfferInput = {
  period: PeriodKind;
  isTrialAvailable: boolean;
};
