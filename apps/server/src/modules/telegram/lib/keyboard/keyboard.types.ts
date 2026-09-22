import type { BotButtons, BotLocale } from '../../telegram.types';

export type ButtonKey = keyof BotButtons;

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
